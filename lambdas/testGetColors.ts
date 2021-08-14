import getColors from "get-image-colors";

export const testGetColors = async () => {
  const colors = await getColors(
    "https://cdn.myanimelist.net/images/anime/4/19644.jpg"
  ).then((colors) => colors.map((color) => color.hex()));
  console.log(colors);
};

testGetColors().then((data) => console.log(data));
