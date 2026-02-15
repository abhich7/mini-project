function startNavigation() {
  const source = document.getElementById("source").value;
  const destination = document.getElementById("destination").value;

  if (source === destination) {
    alert("Source and destination cannot be same.");
    return;
  }

  alert("Navigation from " + source + " to " + destination);
}
