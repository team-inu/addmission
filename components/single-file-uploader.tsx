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

      workBook.SheetNames.map((sheetName) => {
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
    type ExtendedEligible = EligibleSpreadsheetRow & { year: string }

    type ExtendedEligibleWithPartialyApplicant = ExtendedEligible & Partial<ApplicantSpreadsheetRow>
    type ExtendedEligibleWithApplicant = ExtendedEligible & ApplicantSpreadsheetRow

    const isExtendedEligibleWithApplicant = (o: ExtendedEligibleWithPartialyApplicant): o is ExtendedEligibleWithApplicant => {
      return o.hasOwnProperty("ประเภทการเข้า") && o.hasOwnProperty("GPAX")
    }

    const extendedEligibleWithApplicantToPyaoResult = (e: ExtendedEligibleWithApplicant): PyaoResultSpreadsheetRow => {
      return (
        {
          รหัสนักศึกษา: e["รหัสนักศึกษา"],
          "ชื่อ-สกุล": e["ชื่อ - สกุล"],
          ประเภทการเข้า: e["ประเภทการเข้า"],
          โรงเรียน: e["ชื่อสถานศึกษา"] ?? "",
          จังหวัด: e["จังหวัดสถานศึกษา"] ?? "",
          GPAX: e["GPAX"] ?? "",
          "GPA Math": e["รายการคะแนนกลุ่มสาระวิชา_คณิตศาสตร์"] ?? "",
          "GPA Science": e["รายการคะแนนกลุ่มสาระวิชา_วิทยาศาสตร์"] ?? "",
          "GPA English": e["รายการคะแนนกลุ่มสาระวิชา_ภาษาต่างประเทศ"] ?? "",
          "GPAX 1": e[`1/${Number(e["year"])}`] || "",
          "GPAX 2": e[`2/${Number(e["year"])}`] || "",
          "GPAX 3": e[`1/${Number(e["year"]) + 1}`] || "",
          "GPAX 4": e[`2/${Number(e["year"]) + 1}`] || "",
          "GPAX 5": e[`1/${Number(e["year"]) + 2}`] || "",
          "GPAX 6": e[`2/${Number(e["year"]) + 2}`] || "",
          "GPAX 7": e[`1/${Number(e["year"]) + 3}`] || "",
          "GPAX 8": e[`2/${Number(e["year"]) + 3}`] || "",
          จำนวนหน่วยกิตรวม: "0",
          หมายเหตุ: e["หมายเหตุ"],
        }
      )
    }

    const workBook = xlsx.utils.book_new();

    const applicantByName = new Map<string, ApplicantSpreadsheetRow>();
    const extendedEligibleWithPartialyApplicantByName = new Map<string, ExtendedEligibleWithPartialyApplicant>();
    
    for (const applicant of applicants) {
      let name
      if (applicant["สัญชาติ"] == "ไทย") {
          name = applicant["คำนำหน้านาม(ไทย)"] + applicant["ชื่อ(ไทย)"] + " " + applicant["นามสกุล(ไทย)"];
      } else {
          name = applicant["คำนำหน้านาม(อังกฤษ)"] + applicant["ชื่อ(อังกฤษ)"] + " " + applicant["นามสกุล(อังกฤษ)"];
      }

      applicantByName.set(name, applicant);
    }

    for (const eligible of eligibles) {
      const applicant = applicantByName.get(eligible["ชื่อ - สกุล"])
      if (!applicant) {
        const text = `${eligible["ชื่อ - สกุล"]} ${eligible["รหัสนักศึกษา"]} is not merged"`
        console.log(text)
        setLogs((prev) => prev + 1)
      }

      const year = eligible["รหัสนักศึกษา"].substring(0, 2);

      const value: ExtendedEligibleWithPartialyApplicant = {
        ...applicant,
        ...{
          ...eligible,
          year,
        },
      };
  
      extendedEligibleWithPartialyApplicantByName.set(eligible["ชื่อ - สกุล"], value);
    }

    const extendedEligibleWithPartialyApplicants = Array.from(extendedEligibleWithPartialyApplicantByName.values());

    const filteredArr = extendedEligibleWithPartialyApplicants.filter(isExtendedEligibleWithApplicant);

    const regStudents = filteredArr.filter((student) => {
      return student["สาขาวิชาที่สมัคร"] === "วิศวกรรมคอมพิวเตอร์ - วศ.บ. 4 ปี"
    })
    const interStudents = filteredArr.filter((student) => {
      return student["สาขาวิชาที่สมัคร"] === "วิศวกรรมคอมพิวเตอร์ (หลักสูตรนานาชาติ) - วศ.บ. 4 ปี"
    })
    
    const reg = regStudents.map(extendedEligibleWithApplicantToPyaoResult);
    const inter = interStudents.map(extendedEligibleWithApplicantToPyaoResult);

    const regWorksheet = xlsx.utils.json_to_sheet(reg);
    const interWorksheet = xlsx.utils.json_to_sheet(inter);
    
    xlsx.utils.book_append_sheet(workBook, regWorksheet, "reg");
    xlsx.utils.book_append_sheet(workBook, interWorksheet, "inter");

    xlsx.writeFile(workBook, "output.xlsx");
  };

  useEffect(() => {
    console.log(applicants);
    console.log(eligibles);
    console.log();
  }, [applicants, eligibles]);

  return (
    <div className="container relative mx-auto py-5 space-y-3 bg-white/20 shadow-xl rounded-xl px-5">
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
      <div className="py-3 px-10 font-mono bg-white/20 ">
        {"Uplaoded applicant files"}
        <ul className="h-32 overflow-y-auto  scrollbar-thumb-blue-900 scrollbar scrollbar-track-white/10 ">
          {applicantFiles.map((file, i) => (
            <li key={i}>
              [{(file as any).path}] [{file.type}] {file.name} - {file.size} bytes
            </li>
          ))}
        </ul>
      </div>
      <div className="py-3 px-10 font-mono bg-white/20">
        {"Uploaded eligible files"}
        <ul className="h-32 overflow-y-auto  scrollbar-thumb-blue-900 scrollbar scrollbar-track-white/10">
          {eligibleFiles.map((file, i) => (
            <li key={i}>
              [{(file as any).path}] [{file.type}] {file.name} - {file.size} bytes
            </li>
          ))}
        </ul>
      </div>
     <div className="flex justify-between">
     <div>
     <button
        className="bg-blue-500 hover:bg-blue-700 text-white  font-mono font-bold py-2 px-4 rounded hover:animate-bounce"
        type="button"
        onClick={exportFile}
      >
        {"Cut the red wire"}
      </button>
      <button
        className=" hover:bg-red-800 bg-red-500 text-white font-mono font-bold py-2 px-4 rounded hover:animate-bounce"
        type="button"
        onClick={exportFile}
      >
        {"Cut the blue wire"}
      </button>
     </div>

      <button
        className="bg-white hover:bg-gray-400 text-black font-mono font-bold py-2 px-4 rounded hover:animate-bounce"
        type="button"
        onClick={() => {
          setApplicantFiles([]);
          setEligibleFiles([]);
          setApplicants([]);
          setEligibles([]);
          setLogs(0);
        }}
      >
        {"☕ Detonate (clear all uploaded files)"}
      </button>

     </div>
      {logs > 0 && <div className="p-10 font-mono">
        {`Logs >>> ${logs} (check at the console for more information)`}
      </div>}
    </div>
  );
};

export default MultipleFileUploader;
