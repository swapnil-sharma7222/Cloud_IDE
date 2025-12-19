import { Navigate, useLocation, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { isRoomIdValid } from '../utils/isRoomIdValid';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface JWTPayload{
  isAuth: boolean;
  name: string;
  iat?: number;
  exp?: number;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const tokenn = Cookies.get('jwt_token');
  const token= localStorage.getItem('jwt_token');
  const location = useLocation();
  const {userId, roomId}= useParams();
  const fallbackUrl= location.pathname

  const redirectToAuth = (
    <Navigate to={`/auth?redirect=${fallbackUrl}`} replace />
  );

  if (!token) return redirectToAuth;

  const { name } = jwtDecode<JWTPayload>(token);

  const hasAccess =
    userId === name ||
    (roomId &&  isRoomIdValid(roomId));

  return hasAccess ? <>{children}</> : redirectToAuth;

};

export default ProtectedRoute;