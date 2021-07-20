export const handler = async () => {
  const arrayOf50kNums = Array.from(Array(1000)).map((_, idx) => idx + 1);

  const ids = arrayOf50kNums.map((entry, index) => {
    return {
      id: entry,
      index,
      total: arrayOf50kNums.length,
    };
  });

  console.log(
    "🟢 [SUCCESS] - Ids generated - Number of ids to scrap:",
    ids.length
  );

  return ids;
};
