import { AnimeById } from "jikants/dist/src/interfaces/anime/ById";
import { reduce, camelCase, isEmpty } from "lodash";
import slugify from "slugify";

const determineRelations = (related: AnimeById["related"] | undefined) => {
  if (!related) return undefined;
  const relations = reduce(
    related,
    (result, value, key) => {
      const relationType = camelCase(key);
      if (relationType === "adaptation") return {};
      return (result = {
        ...{ [relationType]: value.map(({ name }) => slugify(name)) },
        ...result,
      });
    },
    {}
  );
  return !isEmpty(relations) ? relations : undefined;
};

export default determineRelations;
