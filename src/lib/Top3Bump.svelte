<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import type { Movie } from "../types";

  export let movies: Movie[] = [];

  let svgEl: SVGSVGElement;
  let tooltipEl: HTMLDivElement;

  const width = 980;
  const height = 520;
  const margin = { top: 30, right: 220, bottom: 60, left: 70 };

  type YearTop = { year: number; top: { genre: string; count: number; rank: 1 | 2 | 3 }[] };

  function computeTop3ByYear(data: Movie[]): YearTop[] {
    const byYear = new Map<number, Map<string, number>>();

    for (const m of data) {
      if (m.year == null || Number.isNaN(m.year)) continue;
      const year = Number(m.year);
      if (!m.genres) continue;

      const yearMap = byYear.get(year) ?? new Map<string, number>();
      byYear.set(year, yearMap);

      for (const gRaw of String(m.genres).split(",")) {
        const g = gRaw.trim();
        if (!g) continue;
        yearMap.set(g, (yearMap.get(g) ?? 0) + 1);
      }
    }

    const years = Array.from(byYear.keys()).sort((a, b) => a - b);

    const result: YearTop[] = years.map((year) => {
      const entries = Array.from(byYear.get(year)!.entries())
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => d3.descending(a.count, b.count));

      const top = entries.slice(0, 3).map((d, i) => ({
        genre: d.genre,
        count: d.count,
        rank: (i + 1) as 1 | 2 | 3
      }));

      return { year, top };
    });

    return result;
  }

  function draw() {
    if (!svgEl) return;
    if (!movies || movies.length === 0) return;

    const yearly = computeTop3ByYear(movies);
    const years = yearly.map(d => d.year);

    const topGenres = Array.from(
      new Set(yearly.flatMap(d => d.top.map(t => t.genre)))
    ).sort(d3.ascending);

    const series = topGenres.map((genre) => {
      const pts = yearly.map((d) => {
        const found = d.top.find(t => t.genre === genre);
        return { year: d.year, rank: found ? found.rank : null, count: found?.count ?? null };
      });
      return { genre, pts };
    });

    const svg = d3.select(svgEl).attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    const x = d3.scaleLinear()
      .domain(d3.extent(years) as [number, number])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([3, 1]) // rank 1 on top
      .range([height - margin.bottom, margin.top]);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")))
      .call(g => g.selectAll("text").attr("font-size", 12));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(3).tickFormat(d => `#${d}`))
      .call(g => g.selectAll("text").attr("font-size", 12));

    svg.append("text")
      .attr("x", (margin.left + width - margin.right) / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", 18)
      .text("Q1: Annual Top 3 Genres (Bump Chart)");

    svg.append("text")
      .attr("x", (margin.left + width - margin.right) / 2)
      .attr("y", height - 18)
      .attr("text-anchor", "middle")
      .attr("font-size", 13)
      .text("Year");

    svg.append("text")
      .attr("x", 18)
      .attr("y", (margin.top + height - margin.bottom) / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", 13)
      .attr("transform", `rotate(-90, 18, ${(margin.top + height - margin.bottom) / 2})`)
      .text("Rank (Top 3)");

    const line = d3.line<{ year: number; rank: number | null }>()
      .defined(d => d.rank !== null)
      .x(d => x(d.year))
      .y(d => y(d.rank as number));

    const tooltip = d3.select(tooltipEl);

    // draw lines
    const gLines = svg.append("g");

    gLines.selectAll("path")
      .data(series)
      .join("path")
      .attr("fill", "none")
      .attr("stroke-width", 2)
      .attr("d", d => line(d.pts as any));

    // draw points for hover
    const points = svg.append("g")
      .selectAll("g")
      .data(series)
      .join("g");

    points.selectAll("circle")
      .data(d => d.pts.filter(p => p.rank !== null).map(p => ({ ...p, genre: d.genre })))
      .join("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.rank as number))
      .attr("r", 4)
      .on("mousemove", (event, d) => {
        tooltip
          .style("display", "block")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .html(`<strong>${d.genre}</strong><br/>Year: ${d.year}<br/>Rank: #${d.rank}<br/>Movies: ${d.count}`);
      })
      .on("mouseleave", () => tooltip.style("display", "none"));

    // legend (right side)
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    legend.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", 13)
      .attr("font-weight", "600")
      .text("Genres appearing in Top 3");

    legend.selectAll("text.genre")
      .data(topGenres)
      .join("text")
      .attr("class", "genre")
      .attr("x", 0)
      .attr("y", (_, i) => 20 + i * 18)
      .attr("font-size", 12)
      .text(d => d);

    // “always in top3” hint (computed)
    const alwaysTop3 = topGenres.filter((g) =>
      yearly.every(y => y.top.some(t => t.genre === g))
    );

    svg.append("text")
      .attr("x", margin.left)
      .attr("y", height - margin.bottom + 45)
      .attr("font-size", 12)
      .text(`Always in Top 3: ${alwaysTop3.length ? alwaysTop3.join(", ") : "None"}`);
  }

  onMount(draw);
  $: if (movies && movies.length > 0) draw();
</script>

<div class="wrap">
  <svg bind:this={svgEl}></svg>
  <div class="tooltip" bind:this={tooltipEl}></div>
</div>

<style>
  .wrap { position: relative; }
  .tooltip{
    position: fixed;
    display: none;
    padding: 8px 10px;
    border: 1px solid #ccc;
    background: white;
    border-radius: 6px;
    font-size: 13px;
    pointer-events: none;
  }
</style>
