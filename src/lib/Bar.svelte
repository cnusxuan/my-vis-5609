<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import type { Movie } from "../types";

  export let movies: Movie[] = [];

  let svgEl: SVGSVGElement;
  let tooltipEl: HTMLDivElement;

  const width = 820;
  const height = 520;
  const margin = { top: 20, right: 30, bottom: 60, left: 140 };

  function computeGenreCounts(data: Movie[]) {
    const counts = new Map<string, number>();

    for (const m of data) {
      if (!m?.genres) continue;

      for (const gRaw of String(m.genres).split(",")) {
        const g = gRaw.trim();
        if (!g) continue;
        counts.set(g, (counts.get(g) ?? 0) + 1);
      }
    }

    return Array.from(counts, ([genre, count]) => ({ genre, count })).sort(
      (a, b) => d3.descending(a.count, b.count)
    );
  }

  function draw() {
    if (!svgEl) return;
    if (!movies || movies.length === 0) return;

    const data = computeGenreCounts(movies);

    const svg = d3.select(svgEl).attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) ?? 0])
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.genre))
      .range([margin.top, height - margin.bottom])
      .padding(0.12);

    // Bars
    const bars = svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", margin.left)
      .attr("y", (d) => y(d.genre)!)
      .attr("height", y.bandwidth())
      .attr("width", (d) => x(d.count) - margin.left);

    // Value labels
    svg
      .append("g")
      .selectAll("text")
      .data(data)
      .join("text")
      .attr("x", (d) => x(d.count) + 6)
      .attr("y", (d) => y(d.genre)! + y.bandwidth() / 2)
      .attr("dominant-baseline", "middle")
      .attr("font-size", 12)
      .text((d) => d.count);

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6))
      .call((g) => g.selectAll("text").attr("font-size", 12));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .call((g) => g.selectAll("text").attr("font-size", 12));

    // Axis labels
    svg
      .append("text")
      .attr("x", (margin.left + width - margin.right) / 2)
      .attr("y", height - 18)
      .attr("text-anchor", "middle")
      .attr("font-size", 13)
      .text("Number of movies");

    svg
      .append("text")
      .attr("x", 18)
      .attr("y", (margin.top + height - margin.bottom) / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", 13)
      .attr(
        "transform",
        `rotate(-90, 18, ${(margin.top + height - margin.bottom) / 2})`
      )
      .text("Genre");

    // Tooltip interactions
    const tooltip = d3.select(tooltipEl);

    bars
      .on("mousemove", (event, d) => {
        tooltip
          .style("display", "block")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`)
          .html(`<strong>${d.genre}</strong><br/>Movies: ${d.count}`);
      })
      .on("mouseleave", () => tooltip.style("display", "none"))
      .on("mouseenter", function () {
        d3.select(this).attr("opacity", 0.7);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
      });
  }

  onMount(draw);

  // re-draw whenever movies changes
  $: if (movies && movies.length > 0) {
    draw();
  }
</script>

<div class="wrap">
  <h2>Genre Distribution</h2>
  <svg bind:this={svgEl}></svg>
  <div class="tooltip" bind:this={tooltipEl}></div>
</div>

<style>
  .wrap {
    position: relative;
  }

  .tooltip {
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
