type event = {
  totalToProcess: number;
};

export const handler = async (event: event) => {
  const arrayOfNums = Array.from(
    Array(event.totalToProcess / 50)
  ).map((_, idx) => [idx * 50, idx * 50 + 49]);

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

  return ids;
};

handler({ totalToProcess: 2000 }).then((res) => console.log(res));
