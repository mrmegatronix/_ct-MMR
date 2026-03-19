async function getColors() {
  const html = await fetch('https://www.coasterstavern.co.nz').then(r => r.text());
  const styles = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styles) {
    console.log(styles.join('\n').match(/--[a-zA-Z0-9-]+:\s*(#[0-9A-Fa-f]{3,6}|rgba?\([^)]+\))/g));
  }
}
getColors();
