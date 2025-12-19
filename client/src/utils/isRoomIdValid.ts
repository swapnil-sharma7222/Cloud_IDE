import axios from "axios"

export const isRoomIdValid = async (roomId: string): Promise<boolean> => {
  const response = await axios.get(`http://localhost:4200/v1/api/rooms/?roomId=${roomId}`);
  return response.data.valid;
}