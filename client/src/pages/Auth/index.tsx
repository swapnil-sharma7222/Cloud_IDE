import { Button, TextField } from "@mui/material";
import Box from "@mui/material/Box";
import axios from "axios";
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setUser } from "../../features/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../app/store";
import Cookies from 'js-cookie'
import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  userId: string;
  name: string;
  iat?: number;
  exp?: number;
}

const Auth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();

  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const userName = useSelector((state: RootState) => state.user.name);
  const redirectUrl = searchParams.get('redirect');

  useEffect(() => {
    const token = Cookies.get('jwt_token');

    if (token) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);

        // Check if token is valid
        if (!decoded.exp || decoded.exp * 1000 > Date.now()) {
          // Store in Redux
          dispatch(setUser({
            name: decoded.name
          }));

          if (redirectUrl) {
            navigate(decodeURIComponent(redirectUrl), { replace: true });
          } else {
            navigate(`/${decoded.userId}/dashboard`, { replace: true });
          }
        } else {
          localStorage.removeItem('jwt_token');
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('jwt_token');
      }
    }
  }, [dispatch, navigate, redirectUrl]);


  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      alert("Please fill in all fields");
      return;
    }

    console.log("Form submitted! ", name, password);
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:4200/v1/api/login", {
        name,
        password
      });

      if (response.data.success) {
        console.log("Login Successful");
        dispatch(setUser({
          name: response.data.name
        }));
        localStorage.setItem('jwt_token', response.data.token);

        setName("");
        setPassword("");

        if (redirectUrl) {
          navigate(decodeURIComponent(redirectUrl), { replace: true });
        } else {
          navigate(`/${response.data.name}/dashboard`, { replace: true });
        }
      } else {
        alert("Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      if (error.response) {
        console.error(error.response.data.message);
        alert(error.response.data.message);
      } else if (error.message) {
        console.error(error.message);
        alert("Failed to connect to server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <h1>Welcome to Cloud IDE</h1>
      <h1 style={{ height: "10%" }}></h1>
      <Box
        component="form"
        onSubmit={handleFormSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2, width: 300 }}
      >
        <TextField label="Name" variant="outlined" disabled={loading} value={name} onChange={(e) => setName(e.target.value)} required />
        <TextField label="Password" variant="outlined" type="password" disabled={loading} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" variant="contained">
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </Box>
    </div>
  );
};

export default Auth;