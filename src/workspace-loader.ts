let workspace: Promise<typeof import("./App")> | undefined;

/** Start genuine workspace preparation while the independent opening is playing. */
export function loadWorkspace() {
  return (workspace ??= Promise.all([import("./App"), import("./pages/Index")])
    .then(([application]) => application)
    .catch((error) => {
      workspace = undefined;
      throw error;
    }));
}
