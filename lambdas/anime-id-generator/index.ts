type event = {
  totalToProcess: number;
  processAtIndex?: number;
  factor?: number;
};

export const handler = async (event: event) => {
  const arrayOfNums = Array.from(
    Array(event.totalToProcess / (event.factor || 50))
  ).map((_, idx) => [
    idx * (event.factor || 50) + (event.processAtIndex || 0),
    idx * (event.factor || 50) +
      (event.factor ? event.factor - 1 : 49) +
      (event.processAtIndex || 0),
  ]);

  const ids = arrayOfNums.map((entry) => {
    return {
      startIndex: entry[0],
      endIndex: entry[1],
      total: event.totalToProcess,
    };
  });

  console.log(
    "🟢 [SUCCESS] - Ids generated - Number of ids to scrap:",
    ids.length
  );

  console.log(Array.from(Array(5)).map((_, idx) => idx + 95 + 1));

  return ids;
};

// handler({ totalToProcess: 100, processAtIndex: 20 }).then((res) =>
//   console.log(res)
// );
