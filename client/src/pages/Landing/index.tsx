import React from "react";
import { TextField, Button, Box } from "@mui/material";
import axios from "axios";

const LandingPage = () => {
  const [projectName, setProjectName] = React.useState("");
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted! ", projectName);
    setProjectName("");
    axios.post("http://localhost:4200/v1/api/init-project", { name: projectName })
      .then(response => {
        console.log("Project created: ", response.data);
      })
      .catch(error => {
        console.error("Error creating project: ", error);
      });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <h1>Welcome to the Project Dashboard</h1>
      <h1 style={{height: "10%"}}></h1>
      <Box
        component="form"
        onSubmit={handleFormSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2, width: 300 }}
      >
        <TextField label="Project Name" variant="outlined" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        <Button type="submit" variant="contained">
          Submit
        </Button>
      </Box>
    </div>
  );
};

export default LandingPage;
