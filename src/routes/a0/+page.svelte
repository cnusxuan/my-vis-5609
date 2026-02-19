<script>
  let count = 0;
  let maxClicks = 5;

  $: remaining = Math.max(0, maxClicks - count);

  function inc() {
    if (count >= maxClicks) {
      alert("No more clicks remaining!");
      return;
    }
    count += 1;
    if (count >= maxClicks) {
      alert("No more clicks remaining!");
    }
  }

  function dec() {
    count = Math.max(0, count - 1);
  }

  function onMaxChange() {
    if (maxClicks < 0) maxClicks = 0;
    count = Math.min(count, maxClicks);
  }
</script>

<h1>Button Test (Svelte)</h1>

<div class="box">
  <p>Counter: <span class="num">{count}</span></p>
  <p>Remaining clicks: <span class="num">{remaining}</span></p>

  <div class="row">
    <label for="maxClicks">Max clicks:</label>
    <input
    id="maxClicks"
    type="number"
    bind:value={maxClicks}
    on:input={onMaxChange}
    />

  </div>

  <div class="btns">
    <button on:click={inc} disabled={count >= maxClicks}>+1 Click</button>
    <button on:click={dec}>-1 Click</button>
  </div>
</div>

<style>
  button {
    background-color: #44aa66;
    color: white;
    font-size: xx-large;
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
  }
</style>
