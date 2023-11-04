/* eslint-disable @next/next/no-img-element */
"use client";

import PreviewTable from "@/components/preview-table";
import MultipleFileUploader from "@/components/single-file-uploader";

export default function Home() {
  return (
    <div className="">
      <div className="absolute flex bottom-5 right-5 w-44 h-44">
        <img
          src="https://i.pinimg.com/originals/f6/a2/4f/f6a24fd57aa80739c8cf82e75c230bd8.png"
          alt=""
        />
      </div>
      <div className="absolute flex bottom-5 left-5 w-44 h-44">
        <img
          src="https://media4.giphy.com/media/xd22iKsu0Wn0Q/200w.gif?cid=6c09b952kj20nyrpsfxwory7gicglw31mdyho9a561z6nc8w&ep=v1_gifs_search&rid=200w.gif&ct=s"
          alt=""
        />
      </div>
      <div className="flex flex-col items-center justify-center h-screen space-y-3">
        <div className="text-2xl font-bold">INU【犬】</div>
      <MultipleFileUploader />
      </div>
      {/* Table not for now  */}
      {/* <PreviewTable /> */}
    </div>
  );
}
