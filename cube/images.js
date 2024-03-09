const imagesArray = [
  { value: "carpet", src: "/images/carpet.png", alt: "Carpet" },
  { value: "carpet1", src: "/images/carpet1.png", alt: "Carpet1" },
  { value: "carpet4", src: "/images/carpet2.jpg", alt: "Carpet4" },
  { value: "carpet5", src: "/images/carpet3.jpg", alt: "Carpet5" },
  { value: "carpet6", src: "/images/carpet4.jpg", alt: "Carpet6" },
  { value: "carpet7", src: "/images/carpet5.jpg", alt: "Carpet7" },
];

const imageRow = document.getElementById("image-row");
for(let i=0; i<10;i++) {
    imagesArray.forEach((imageData) => {
    
    const { src, alt } = imageData;
    const colDiv = document.createElement("div");
    colDiv.className = " col-lg-2 mb12";
    const imgElement = document.createElement("img");
    imgElement.src = src;
    imgElement.alt = alt;
    colDiv.appendChild(imgElement);
    imageRow.appendChild(colDiv); 
    });
}
