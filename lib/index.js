/**
 * dsh-whale-aquarium — node half.
 *
 * The empty `apply` gives Loader a host-side row for this package; everything
 * this plugin does lives in the browser and ships through `exports["./client"]`
 * (see lib/client.js and the `dsh.client` declaration in package.json).
 *
 * Keep this file side-effect free: the web surface loads it in the DSH process on
 * every start.
 */
export function apply() {}
