<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import type { Movie } from "../types";

  export let movies: Movie[] = [];

  let svgEl: SVGSVGElement;
  let tooltipEl: HTMLDivElement;

  const width = 980;
  const height = 820;
  const margin = { top: 120, right: 30, bottom: 30, left: 140 };

  type Cell = { a: string; b: string; value: number };

  function computeCooccurrence(data: Movie[]) {
    const genreSet = new Set<string>();
    const rows: string[][] = [];

    for (const m of data) {
      if (!m.genres) continue;
      const gs = String(m.genres)
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      if (gs.length === 0) continue;

      const uniq = Array.from(new Set(gs));
      rows.push(uniq);
      uniq.forEach(g => genreSet.add(g));
    }

    const genres = Array.from(genreSet).sort(d3.ascending);

    const counts = new Map<string, number>();
    const key = (a: string, b: string) => `${a}|||${b}`;

    for (const gs of rows) {
      for (let i = 0; i < gs.length; i++) {
        for (let j = 0; j < gs.length; j++) {
          const a = gs[i];
          const b = gs[j];
          counts.set(key(a, b), (counts.get(key(a, b)) ?? 0) + 1);
        }
      }
    }

    const cells: Cell[] = [];
    for (const a of genres) {
      for (const b of genres) {
        cells.push({ a, b, value: counts.get(key(a, b)) ?? 0 });
      }
    }

    return { genres, cells };
  }

  function draw() {
    if (!svgEl) return;
    if (!movies || movies.length === 0) return;

    const { genres, cells } = computeCooccurrence(movies);
    const maxV = d3.max(cells, d => d.value) ?? 1;

    const svg = d3.select(svgEl).attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    svg.append("text")
      .attr("x", (margin.left + width - margin.right) / 2)
      .attr("y", 28)
      .attr("text-anchor", "middle")
      .attr("font-size", 18)
      .text("Q2: Genre Co-occurrence Heatmap");

    const x = d3.scaleBand<string>()
      .domain(genres)
      .range([margin.left, width - margin.right])
      .padding(0.03);

    const y = d3.scaleBand<string>()
      .domain(genres)
      .range([margin.top, height - margin.bottom])
      .padding(0.03);

    const color = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, maxV]);

    svg.append("g")
      .attr("transform", `translate(0,${margin.top})`)
      .call(d3.axisTop(x).tickSize(0))
      .call(g => g.selectAll("text")
        .attr("font-size", 11)
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "start"));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0))
      .call(g => g.selectAll("text").attr("font-size", 11));

    const tooltip = d3.select(tooltipEl);

    svg.append("g")
      .selectAll("rect")
      .data(cells)
      .join("rect")
      .attr("x", d => x(d.a)!)
      .attr("y", d => y(d.b)!)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.value))
      .on("mousemove", (event, d) => {
        tooltip
          .style("display", "block")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .html(`<strong>${d.a} + ${d.b}</strong><br/>Co-occur count: ${d.value}`);
      })
      .on("mouseleave", () => tooltip.style("display", "none"));

    svg.append("text")
      .attr("x", margin.left)
      .attr("y", height - 10)
      .attr("font-size", 12)
      .text("Tip: Diagonal shows how often each genre appears (with itself). Off-diagonal shows co-occurrence.");
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
