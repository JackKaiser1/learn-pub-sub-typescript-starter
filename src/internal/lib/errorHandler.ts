export function handleError(err: any) {
  if (err instanceof Error) {
    console.log(`Error: ${err.message}`);
  } else {
    console.log(err);
  }
}