<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { base } from "$app/paths";

  import Bar from "$lib/Bar.svelte";
  import Top3Bump from "$lib/Top3Bump.svelte";
  import GenreHeatmap from "$lib/GenreHeatmap.svelte";

  import type { Movie } from "../../types";

  let movies: Movie[] = [];
  let errorMsg = "";
  let loading = true;

  onMount(async () => {
    try {
      const csvPath = `${base}/summer_movies.csv`;

      const data = await d3.csv(csvPath, d3.autoType);
      movies = data as Movie[];

      console.log("csvPath:", csvPath);
      console.log("movies loaded:", movies.length);
    } catch (err) {
      console.error("failed to load csv:", err);
      errorMsg = String(err);
    } finally {
      loading = false;
    }
  });
</script>

<h1>Summer Movies Dataset (A1)</h1>

{#if loading}
  <p>Loading data...</p>
{:else if errorMsg}
  <p style="color:red;">Error loading data: {errorMsg}</p>
{:else}
  <p style="color:green;"> Data loaded successfully. movies length: {movies.length}</p>

  {#if movies.length > 0}
    <hr />

    <h2>Part 1: Genre Distribution</h2>
    <Bar {movies} />

    <hr />

    <h2>Part 2: Q1 — Annual Top 3 Genres Over Time</h2>
    <Top3Bump {movies} />

    <hr />

    <h2>Part 3: Q2 — Genre Correlation Heatmap</h2>
    <GenreHeatmap {movies} />

    <hr />
    <p style="color:gray;">End of page.</p>
  {/if}
{/if}
