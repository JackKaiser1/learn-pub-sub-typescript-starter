export function handleError(err: Error) {
  if (err instanceof Error) {
    console.log(`Error: ${err.message}`);
  } else {
    console.log(err);
  }
}