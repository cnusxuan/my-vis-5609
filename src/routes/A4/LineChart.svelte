<script lang="ts">
  import * as d3 from "d3";
  import type { TMovie } from "../../types";

  export let movies: TMovie[] = [];
  export let progress: number = 0;

  type GenrePoint = {
    genre: string;
    year: number;
    value: number;
  };

  type GenreSeries = {
    genre: string;
    values: { year: number; value: number }[];
  };

  let width = 900;
  let height = 560;
  let margin = { top: 40, right: 180, bottom: 60, left: 70 };

  $: processed = movies.flatMap((d: TMovie): GenrePoint[] =>
    d.genres.map((g: string) => ({
      genre: g,
      year: d.year.getFullYear(),
      value: 1
    }))
  );

  $: genreTotals = d3
    .rollups(
      processed,
      (v) => v.length,
      (d) => d.genre
    )
    .sort((a, b) => b[1] - a[1]);

  $: topGenres = new Set(genreTotals.slice(0, 5).map((d) => d[0]));

  $: filteredProcessed = processed.filter((d) => topGenres.has(d.genre));

  $: grouped = d3.rollups(
    filteredProcessed,
    (v: GenrePoint[]) => v.length,
    (d: GenrePoint) => d.genre,
    (d: GenrePoint) => d.year
  );

  $: data = grouped.map(
    ([genre, values]): GenreSeries => ({
      genre,
      values: values
        .map(([year, value]) => ({ year, value }))
        .sort((a, b) => a.year - b.year)
    })
  );

  $: years = [...new Set(filteredProcessed.map((d: GenrePoint) => d.year))].sort(
    (a, b) => a - b
  );

  $: minYear = years.length ? d3.min(years)! : 2000;
  $: maxYear = years.length ? d3.max(years)! : 2000;

  $: currentYear = Math.floor(
    minYear + (progress / 100) * (maxYear - minYear)
  );

  $: xScale = d3
    .scaleLinear()
    .domain([minYear, maxYear])
    .range([margin.left, width - margin.right]);

  $: yMax =
    d3.max(data.flatMap((d: GenreSeries) => d.values.map((v) => v.value))) || 0;

  $: yScale = d3
    .scaleLinear()
    .domain([0, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  $: line = d3
    .line<{ year: number; value: number }>()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  $: color = d3.scaleOrdinal<string, string>()
    .domain(data.map((d) => d.genre))
    .range(d3.schemeTableau10);
</script>

<svg {width} {height}>
  <!-- title -->
  <text
    x={width / 2}
    y={24}
    text-anchor="middle"
    font-size="22"
    font-weight="700"
  >
    Genre Trends Over Time
  </text>

  <!-- current year guide -->
  <line
    x1={xScale(currentYear)}
    x2={xScale(currentYear)}
    y1={margin.top}
    y2={height - margin.bottom}
    stroke="gray"
    stroke-dasharray="4 4"
  />
  <text
    x={xScale(currentYear)}
    y={margin.top - 10}
    text-anchor="middle"
    font-size="12"
  >
    {currentYear}
  </text>

  <!-- y grid lines -->
  {#each yScale.ticks(5) as t}
    <line
      x1={margin.left}
      x2={width - margin.right}
      y1={yScale(t)}
      y2={yScale(t)}
      stroke="#ddd"
    />
  {/each}

  <!-- x axis -->
  <line
    x1={margin.left}
    x2={width - margin.right}
    y1={height - margin.bottom}
    y2={height - margin.bottom}
    stroke="black"
  />
  {#each xScale.ticks(6) as t}
    <g transform={`translate(${xScale(t)},0)`}>
      <line
        y1={height - margin.bottom}
        y2={height - margin.bottom + 6}
        stroke="black"
      />
      <text y={height - margin.bottom + 22} text-anchor="middle" font-size="12">
        {t}
      </text>
    </g>
  {/each}

  <!-- y axis -->
  <line
    x1={margin.left}
    x2={margin.left}
    y1={margin.top}
    y2={height - margin.bottom}
    stroke="black"
  />
  {#each yScale.ticks(5) as t}
    <g transform={`translate(0,${yScale(t)})`}>
      <line x1={margin.left - 6} x2={margin.left} stroke="black" />
      <text x={margin.left - 10} text-anchor="end" dominant-baseline="middle" font-size="12">
        {t}
      </text>
    </g>
  {/each}

  {#each data as d}
    {#if d.values.filter((v) => v.year <= currentYear).length > 1}
      <path
        d={line(d.values.filter((v) => v.year <= currentYear)) ?? ""}
        fill="none"
        stroke={color(d.genre)}
        stroke-width="2.5"
      />
    {/if}
  {/each}

  {#each data as d, i}
    <g transform={`translate(${width - margin.right + 25}, ${margin.top + i * 24})`}>
      <line x1="0" x2="20" y1="0" y2="0" stroke={color(d.genre)} stroke-width="3" />
      <text x="28" y="4" font-size="12">{d.genre}</text>
    </g>
  {/each}
</svg>