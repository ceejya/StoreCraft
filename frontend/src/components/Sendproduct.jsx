import { react, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from "axios"

const Sendproduct = ({ socket }) => {
    const navigate = useNavigate()
    const token = localStorage.getItem("usertoken")

    const [message, setmessage] = useState([])
    const [Currentuser, setCurrentuser] = useState(null)
    const [allmessage, setallmessage] = useState({
        title: "",
        content: ""
    })

    const sendmessage = () => {
        const chatdetail = {
            ...allmessage, sender: currentuser._id
        }
        socket.emit("sendmessage", chatdetail)
    }

    useEffect(() => {
        socket.on("resend", (newmessage) => {
            console.log(newmessage);

            setmessage([...message, newmessage])
        })
    }, [message])

    useEffect(() => {

        socket.on("refreshmessage", (refreshedmessage) => {
            setmessage(refreshedmessage)

        })
    }, [message])




    useEffect(() => {
        axios.get("http://localhost:8004/user/verifytoken", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }).then((res) => {
            setCurrentuser(res.data.currentUser)
            console.log(res.data);

        }).catch((err) => {


            console.log(err);
            localStorage.removeItem("usertoken")
            navigate("/login")


            // navigate("/login")


        })


    }, [])







    return (
        <>
            <h2>Welcome {Currentuser ? Currentuser.username : "loading"}  </h2>
            <div className='mx-auto w-50 shadow py-3 px-3 '>


                <input className='form-control mb-3' onChange={(e) => setallmessage({ ...allmessage, title: e.target.value })} type="text" placeholder='Insert Your Message' />
                < input className='form-control mb-3' onChange={(e) => setallmessage({ ...allmessage, content: e.target.value })} type="text" placeholder='Insert Your Message' />
                <button onClick={sendmessage} className='btn btn-dark'>Send</button>


            </div>

            <div>
                {message.map((name, i) => (
                    <>
                        <div>
                            <p>{name.title}</p>
                            <p>{name.content}</p>
                        </div>
                    </>
                ))}


            </div>
        </>
    )
}

export default Sendproduct