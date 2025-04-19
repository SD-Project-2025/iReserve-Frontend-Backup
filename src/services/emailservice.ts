import axios from "axios"
//@ts-ignore
const emailUrl = import.meta.env.VITE_EMAIL_URL;
export const emailservice = axios.create({
  //@ts-ignore
  baseURL: emailUrl
})
