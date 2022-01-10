<script>
  import { onMount } from "svelte";
  import http from "./request-helper";
  import OperationDocsStore from "./operationDocsStore";
  import { isAuthenticated, user, fruits, token } from "./store";
  import auth from "./auth-service";
  import { writable } from "svelte/store";
  let auth0Client;
  onMount(async () => {
    auth0Client = await auth.createClient();

    isAuthenticated.set(await auth0Client.isAuthenticated());
    user.set(await auth0Client.getUser());
    if (isAuthenticated) {
      const accessToken = await auth0Client.getIdTokenClaims();
      token.set(accessToken.__raw);
    }
  });

  token.subscribe(async (value) => {
    if (value) {
      const result = await http.startFetchMyQuery(OperationDocsStore.getAll());
      fruits.set(result.fruits);
    }
  });

  const addFruit = async () => {
    const name = prompt("name") || "";
    const { insert_fruits_one } = await http.startExecuteMyMutation(
      OperationDocsStore.addOne(name),
    );
    fruits.update((n) => [...n, insert_fruits_one]);
  };

  const offline = writable(false);
  window.onoffline = () => {
    offline.set(true);
  };
  window.ononline = () => {
    offline.set(false);
  };
  
  const deleteFruit = async () => {
    const name = prompt("which fruit to delete?") || "";
    if (name) {
      await http.startExecuteMyMutation(OperationDocsStore.deleteByName(name));
      fruits.update((n) => n.filter((fruit) => fruit.name !== name));
    }
  };

  function login() {
    auth.loginWithPopup(auth0Client);
  }

  function logout() {
    auth.logout(auth0Client);
  }
</script>

<main>
  {#if $isAuthenticated}
    <button on:click={logout}>Log out</button>
    <button on:click={addFruit}>Add new fruit</button>
    <button on:click={deleteFruit}>Delete fruit</button>

    {#each $fruits as fruit}
      <div>
        <p>fruit name: {fruit.name}</p>
        <p>user id: {fruit.user_id}</p>
        <hr />
      </div>
    {/each}
  {:else}
    <button on:click={login}>Log in</button>{/if}
</main>

<style>
  main {
    margin: 0;
    padding: 0;
  }
</style>
