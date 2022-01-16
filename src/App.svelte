<script>
  import { onMount } from "svelte";
  import http from "./request-helper";
  import OperationDocsStore from "./operationDocsStore";
  import { isAuthenticated, user, fruits, token } from "./store";
  import auth from "./auth-service";
  import { writable } from "svelte/store";
  import { errors, requestCounter } from "./store";
  const inputValues = {};
  let auth0Client;
  onMount(async () => {
    auth0Client = await auth.createClient();

    isAuthenticated.set(await auth0Client.isAuthenticated());
    user.set(await auth0Client.getUser());
    if (isAuthenticated) {
      const accessToken = await auth0Client.getIdTokenClaims();
      token.set(accessToken?.__raw);
    }
  });

  token.subscribe(async (value) => {
    if (value) {
      const result = await http.startFetchMyQuery(OperationDocsStore.getAll());
      fruits.set(result.fruits);
    }
  });

  const addFruit = () => {
    const { name } = inputValues;
    http
      .startExecuteMyMutation(OperationDocsStore.addOne(name ?? ""))
      .then(({ insert_fruits_one }) => {
        fruits.update((n) => [...n, insert_fruits_one]);
      })
      .catch((e) => {
        console.error(e);
        $errors = [e.message];
      });
  };

  const offline = writable(false);
  window.onoffline = () => {
    offline.set(true);
  };
  window.ononline = () => {
    offline.set(false);
  };

  const deleteFruit = (id) => {
    http
      .startExecuteMyMutation(OperationDocsStore.deleteById(id))
      .then(() => {
        fruits.update((n) => n.filter((item) => item.id !== id));
      })
      .catch((e) => {
        console.error(e);
        $errors = [e.message];
      });
  };

  function login() {
    auth.loginWithPopup(auth0Client);
  }

  function logout() {
    auth.logout(auth0Client);
  }
</script>

<main>
  {#if !$offline}
    {#if $isAuthenticated}
      {#if $requestCounter}
        <h1>Loading...</h1>
      {:else if $errors.length}
        <h1>{$errors.join("\n")}</h1>
      {:else}
        <div>
          <input placeholder="Add fruit" bind:value={inputValues.name} />
          <button on:click={addFruit}>Add new fruit</button>
        </div>

        {#if $fruits?.length}
          {#each $fruits as fruit (fruit.id)}
            <div>
              <p>fruit name: {fruit.name}</p>
              <p>user id: {fruit.user_id}</p>
              <button on:click={() => deleteFruit(fruit.id)}
                >Delete fruit</button
              >
              <hr />
            </div>
          {/each}
        {:else}
          <h1>No fruits :(</h1>
        {/if}
        {#if $errors.length}
          <h2>{$errors[0]}</h2>
        {/if}
      {/if}
    {:else}
      <button on:click={login}>Log in</button>{/if}
  {:else}
    <h1>You are offline</h1>
  {/if}
</main>

<style>
  main {
    margin: 0;
    padding: 0;
  }
</style>
