

// import { Editor } from "@monaco-editor/react";

// // type Props = {
// //     language: string;
// //     value: string;
// //     height?: string
// //     onChange?: (value: string | undefined) => void;
// // }

// const DEFAULT_LANGUAGE = 'javascript'

// export const CodeEditor = (
// //     {
// //     language,
// //     value,
// //     height = '60vh',
// //     onChange
// // }: Props
// ) => {

//     // const handleChange = (value: string | undefined) => {
//     //     if(onChange) {
//     //         onChange(value);
//     //     }
//     // }
    
//     return (
//         <Editor/>
//         // <Editor 
//             // theme='vs-dark'
//             // height={height}
//             // defaultLanguage={DEFAULT_LANGUAGE}
//             // language={language ?? DEFAULT_LANGUAGE}
//             // onChange={handleChange}
//             // value={value || ''}
//         //   />
//     )
// }

// import  Editor, { OnChange } from "@monaco-editor/react";

// type Props = {
//   language?: string; // Optional language prop
//   value?: string; // Optional value prop
//   height?: string; // Optional height prop
//   onChange?: (value: string | undefined) => void; // Optional change handler
// };

// const DEFAULT_LANGUAGE = "javascript";

// export const CodeEditor: React.FC<Props> = ({
//   language = DEFAULT_LANGUAGE,
//   value = "",
//   height = "60vh",
//   onChange,
// }) => {
//   const handleEditorChange: OnChange = (value) => {
//     if (onChange) {
//       onChange(value);
//     }
//   };

//   return (
//     <Editor
//       theme="vs-dark"
//       height={height}
//       language={language}
//       value={value}
//       onChange={handleEditorChange}
//     />
//   );
// };


import { useMonaco } from "@monaco-editor/react";
import { Editor } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import FileTabs from "./FileTabs";

type Props = {
  theme?: string
  language?: string; // Optional language prop
  value?: string; // Optional value prop
  onChange?: (value: string | undefined) => void; // Optional change handler
};

export function CodeEditor ({theme, language, value}: Props) {
  const monaco= useMonaco();
  useEffect(() => {
    if(monaco){
      console.log('here is the monaco instance:', monaco);
    }
  }, [monaco])
  
  function handleEditorChange(): void {
    console.log('here is the current model value:');
  }
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1e1e1e",
        width: "100%",
        height: "calc(100vh - 200px)", // Deducting the terminal height
        color: "#fff",
        transition: "height 0.1s ease",
      }}
    >
      <FileTabs />
      <Box
        sx={{
          flexGrow: 1,
          padding: 2,
          backgroundColor: "#1e1e1e",
          color: "#fff",
        }}
      >
        {/* Placeholder for Monaco Editor content */}
        <Editor
          theme={ theme|| "vs-dark" }
          height="100vh"
          defaultLanguage="typescript"
          defaultValue=""
          language={language}
          value={value}
          onChange={handleEditorChange}
          className="editor"
        />
      </Box>
    </Box>
  );
}


