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

  console.log(
    "🟢 [SUCCESS] - Ids generated - Number of ids to scrap:",
    arrayofNums.length
  );

  return arrayofNums;
};
