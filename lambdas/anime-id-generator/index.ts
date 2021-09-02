type event = {
  totalToProcess: number;
  processAtIndex?: number;
};

export const handler = async (event: event) => {
  const arrayOfNums = Array.from(
    Array(event.totalToProcess / 5)
  ).map((_, idx) => [
    idx * 5 + (event.processAtIndex || 0),
    idx * 5 + 4 + (event.processAtIndex || 0),
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

handler({ totalToProcess: 20, processAtIndex: 20 }).then((res) =>
  console.log(res)
);
