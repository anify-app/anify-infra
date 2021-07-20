import { AnimeById } from "jikants/dist/src/interfaces/anime/ById";

const cleanMalArrayFields = (array: AnimeById["genres"] | undefined) =>
  array ? array.map(({ name }) => name) : [];

export default cleanMalArrayFields;
