/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Dropzone, { DropEvent, FileRejection } from "react-dropzone";
import * as xlsx from "xlsx";
import {
  ApplicantSpreadsheetRow,
  applicantSpreadsheetHeader,
} from "@/libs/spreadsheet/applicant-spreadsheet";
import { EligibleSpreadsheetRow } from "@/libs/spreadsheet/eligible-spreadsheet";
import { PyaoResultSpreadsheetRow } from "@/libs/spreadsheet/pyao-result-spreadsheet";

const MultipleFileUploader = () => {
  const [applicantFiles, setApplicantFiles] = useState<File[]>([]);
  const [eligibleFiles, setEligibleFiles] = useState<File[]>([]);

  const [logs, setLogs] = useState<number>(0);

  const [applicants, setApplicants] = useState<ApplicantSpreadsheetRow[]>([]);
  const [eligibles, setEligibles] = useState<EligibleSpreadsheetRow[]>([]);

  const onApplicantFilesDrop = <T extends File>(
    acceptedFiles: T[],
    _fileRejections: FileRejection[],
    _event: DropEvent
  ) => {
    const readFile = async (file: File) => {
      const buffer = await file.arrayBuffer();
      const workBook = xlsx.read(buffer, { type: "buffer" });

      const sheet1 = workBook.Sheets[workBook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet1, {
        range: 6,
        header: applicantSpreadsheetHeader,
      }) as ApplicantSpreadsheetRow[];

      if (data.length === 0) {
        return;
      }

      setApplicants((prev) => [...prev, ...data]);
    };

    setApplicantFiles(acceptedFiles);

    const promises = acceptedFiles.map((file) => {
      if (file.type !== "application/vnd.ms-excel") {
        return Promise.resolve();
      }
      return readFile(file);
    });

    Promise.all(promises).then(() => {
      console.log("All files have been read");
    });
  };

  const onEligibleFilesDrop = <T extends File>(
    acceptedFiles: T[],
    _fileRejections: FileRejection[],
    _event: DropEvent
  ) => {
    const readFile = async (file: File) => {
      const buffer = await file.arrayBuffer();
      const workBook = xlsx.read(buffer, { type: "buffer" });

      const data = workBook.SheetNames.map((sheetName) => {
        const sheet = workBook.Sheets[sheetName];
        const eligibles = xlsx.utils.sheet_to_json(sheet, {
          range: 1,
        }) as EligibleSpreadsheetRow[];
        setEligibles((prev) => [...prev, ...eligibles]);
      });
    };

    setEligibleFiles(acceptedFiles);

    const promises = acceptedFiles.map((file) => {
      if (file.type !== "application/vnd.ms-excel") {
        return Promise.resolve();
      }
      return readFile(file);
    });

    Promise.all(promises).then(() => {
      console.log("All files have been read");
    });
  };

  const exportFile = () => {
    const workBook = xlsx.utils.book_new();

    const applicantByName = new Map<string, ApplicantSpreadsheetRow>();
    const eligibleByName = new Map<
      string,
      (EligibleSpreadsheetRow & { year: string }) & ApplicantSpreadsheetRow
    >();

    applicants.forEach((applicant) => {
      const name =
        applicant["คำนำหน้านาม(ไทย)"] +
        applicant["ชื่อ(ไทย)"] +
        " " +
        applicant["นามสกุล(ไทย)"];

      applicantByName.set(name, applicant);
    });

    eligibles.forEach((eligible) => {
      const year = eligible["รหัสนักศึกษา"].substring(0, 2);
      const applicant = applicantByName.get(eligible["ชื่อ - สกุล"])

      if (!applicant) {
        const text = `${eligible["ชื่อ - สกุล"]} ${eligible["รหัสนักศึกษา"]} is not merged"`
        console.log(text)
        setLogs((prev) => prev + 1)
      }

      const value = {
        ...applicant!,
        ...{
          ...eligible,
          year,
        },
      };
      eligibleByName.set(eligible["ชื่อ - สกุล"], value);
    });

    const mergedArray = Array.from(eligibleByName.values());
    console.log(eligibleByName);
    console.log(mergedArray);

    const filteredArr = mergedArray.filter(
      (object) =>
        object.hasOwnProperty("ประเภทการเข้า") &&
        object.hasOwnProperty("ชื่อสถานศึกษา")
    );
    const templatedArray = filteredArr.map((student) => {
      return (
      {
        รหัสนักศึกษา: student["รหัสนักศึกษา"],
        "ชื่อ-สกุล": student["ชื่อ - สกุล"],
        ประเภทการเข้า: student["ประเภทการเข้า"],
        โรงเรียน: student["ชื่อสถานศึกษา"],
        จังหวัด: student["จังหวัดสถานศึกษา"],
        GPAX: student["GPAX"],
        "GPA Math": student["รายการคะแนนกลุ่มสาระวิชา_คณิตศาสตร์"],
        "GPA Science": student["รายการคะแนนกลุ่มสาระวิชา_วิทยาศาสตร์"],
        "GPA English": student["รายการคะแนนกลุ่มสาระวิชา_ภาษาต่างประเทศ"],
        "GPAX 1": student[`1/${Number(student["year"])}`] || "",
        "GPAX 2": student[`2/${Number(student["year"])}`] || "",
        "GPAX 3": student[`1/${Number(student["year"]) + 1}`] || "",
        "GPAX 4": student[`2/${Number(student["year"]) + 1}`] || "",
        "GPAX 5": student[`1/${Number(student["year"]) + 2}`] || "",
        "GPAX 6": student[`2/${Number(student["year"]) + 2}`] || "",
        "GPAX 7": student[`1/${Number(student["year"]) + 3}`] || "",
        "GPAX 8": student[`2/${Number(student["year"]) + 3}`] || "",
        จำนวนหน่วยกิตรวม: 0,
        หมายเหตุ: student["หมายเหตุ"],
      }
    )
    });
    console.log(filteredArr);
    console.log(templatedArray);
    const workSheet = xlsx.utils.json_to_sheet(templatedArray);

    xlsx.utils.book_append_sheet(workBook, workSheet, "Students");
    xlsx.writeFile(workBook, "output.xlsx");
  };

  useEffect(() => {
    console.log(applicants);
    console.log(eligibles);
    console.log();
  }, [applicants, eligibles]);

  return (
    <div className="container relative mx-auto py-5 space-y-3 bg-white/20 shadow-xl rounded-md px-5">
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      {/* <img src="https://media.tenor.com/Jojpr9QgMLoAAAAd/maxwell-maxwell-spin.gif" /> */}
      <p className="text-xl font-bold">
        ここにいくつかのファイルをドラッグ
        ドロップするか、クリックしてファイルを選択します。
      </p>
      <div className="space-y-5">
        <Dropzone onDrop={onApplicantFilesDrop}>
          {({ getRootProps, getInputProps }) => (
            <section>
              <div
                {...getRootProps()}
                className="p-10 bg-green-400 flex items-center justify-center cursor-pointer"
              >
                <input {...getInputProps()} />
                <p className="font-mono">
                  Drag drop some files here, or click to select files (Applicant
                  student)
                </p>
              </div>
            </section>
          )}
        </Dropzone>

        <Dropzone onDrop={onEligibleFilesDrop}>
          {({ getRootProps, getInputProps }) => (
            <section>
              <div
                {...getRootProps()}
                className="p-10 bg-pink-400 flex items-center justify-center cursor-pointer"
              >
                <input {...getInputProps()} />
                <p className="font-mono">
                  Drag drop some files here, or click to select files (Eligible
                  student)
                </p>
              </div>
            </section>
          )}
        </Dropzone>
      </div>
      <div className="p-10 font-mono">
        {"Uplaoded applicant files"}
        <ul>
          {applicantFiles.map((file, i) => (
            <li key={i}>
              [{file.type}] {file.name} - {file.size} bytes
            </li>
          ))}
        </ul>
      </div>
      <div className="p-10 font-mono">
        {"Uploaded eligible files"}
        <ul>
          {eligibleFiles.map((file, i) => (
            <li key={i}>
              [{file.type}] {file.name} - {file.size} bytes
            </li>
          ))}
        </ul>
      </div>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white  font-mono font-bold py-2 px-4 rounded hover:animate-bounce"
        type="button"
        onClick={exportFile}
      >
        {"Cut the blue wire"}
      </button>
      <button
        className=" hover:bg-red-800 bg-red-500 text-white font-mono font-bold py-2 px-4 rounded hover:animate-bounce"
        type="button"
        onClick={exportFile}
      >
        {"Cut the red wire"}
      </button>

      <button
        className="bg-white hover:bg-red-700 text-black font-mono font-bold py-2 px-4 rounded hover:animate-bounce"
        type="button"
        onClick={() => {
          setApplicantFiles([]);
          setEligibleFiles([]);
          setApplicants([]);
          setEligibles([]);
          setLogs(0);
        }}
      >
        {"Detonate (clear all uploaded files)"}
      </button>

      {logs > 0 && <div className="p-10 font-mono">
        {`Logs >>> ${logs} (check at the console for more information)`}
      </div>}
    </div>
  );
};

export default MultipleFileUploader;
