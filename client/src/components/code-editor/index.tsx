

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
    <Editor
      theme={ theme|| "vs-dark" }
      height="100vh"
      defaultLanguage="javascript"
      defaultValue=""
      language={language}
      value={value}
      onChange={handleEditorChange}
      className="editor"
    />
  );
}


