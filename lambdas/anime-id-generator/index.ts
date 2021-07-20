type event = {
  startIndex: number;
  totalToProccess: number;
};

export const handler = async (event: event) => {
  let arrayofNums;

  if ((event.startIndex, event.totalToProccess))
    arrayofNums = Array.from(Array(event.totalToProccess)).map(
      (_, idx) => idx + event.startIndex + 1
    );
  else arrayofNums = Array.from(Array(1000)).map((_, idx) => idx + 1);

  const ids = arrayofNums.map((entry, index) => {
    return {
      id: entry,
      index,
      total: arrayofNums.length,
    };
  });

  console.log(
    "🟢 [SUCCESS] - Ids generated - Number of ids to scrap:",
    ids.length
  );

  return ids;
};

handler({ startIndex: 100, totalToProccess: 20 }).then((res) =>
  console.log(res)
);
