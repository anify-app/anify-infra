const determineType = (rawType: string) => {
  if (rawType.includes("TV")) return "tv";
  if (rawType.includes("Movie")) return "movie";
  if (rawType.includes("OVA")) return "ova";
  if (rawType.includes("ONA")) return "ona";
  if (rawType.includes("Special")) return "special";
  return "unknown";
};

export default determineType;
