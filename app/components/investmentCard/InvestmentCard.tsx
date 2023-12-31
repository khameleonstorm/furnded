"use client"
import { BsCheck } from "react-icons/bs"
import s from "./InvestmentCard.module.css";
import useAuth from '../../hooks/useAuth'
import { useFirestore } from '../../hooks/useFirestore'
import { useRouter } from 'next/navigation'
import Message from '../message/Message'
import { collection, onSnapshot, query, where, doc, setDoc } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useEffect, useState } from "react"
import dateFormat from "dateformat";
import { ImSpinner2 } from "react-icons/im";


export default function InvestmentCard({plans}:any) {
  const router = useRouter()
  const createdAt = new Date().toLocaleString()
  const { addDocument } = useFirestore("history")
  const {user} = useAuth()
  const [message, setMessage] = useState(false)
  const [success, setSuccess] = useState<string|null>(null)
  const [failed, setFailed] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [userDetails, setUserDetails] = useState<any>([])


  useEffect(()=>{
    if(user){
      const q = query(collection(db, "profile"), where("email", "==", user.email))

      onSnapshot(q, 
        (snapshot) => {
          // looping through snapshot to get each individual doc
          snapshot.forEach(doc => {
            setUserDetails({ ...doc.data(), id: doc.id})
          })
        }, (error) => {
          // setError("could not fetch data frm the database...")
        })
    }
  }, [user])


    const handleInvest = async (desc:any, title:any) => {
      setSuccess(null)
      setFailed(null)
      setMessage(false)
      setLoading(true)

      if (user) {
        const amount = Number(window.prompt("Enter investment amount", ""))
        
        if (amount < userDetails.bal.balance) {
          console.log(amount)
          addDocument({ title: `${title} Investment`, amount, desc, createdAt, email: user.email, pending: true })
          
          let newBal = userDetails.bal.balance - amount
          
          const newData = {...userDetails, bal: {...userDetails.bal, balance: newBal, investment: amount + userDetails.bal.investment}}
          const docRef = doc(db, "profile", user.email)

          setDoc(docRef, newData)

          const investData = {
            amount,
            name: user.displayName,
            email: user.email,
            date: dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss"),
          }

          
          const res = await fetch(`/api/invest`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(investData),
          })
        
          const data = await res.json()

          if(res.ok){
            setSuccess("Your investment was successful")
            setMessage(true)
          } else console.log(data.message)

        }

        if(amount > userDetails.bal.balance) {
          setFailed("Insufficient funds")
          setMessage(true)
        } 
      } else {
        router.push("/login")
      }

      setLoading(false)
    }

    
  if(loading){
    return (
      <div className={s.spinner}>
        <div className="spinner">
        <ImSpinner2 className="spin spinBig" color="#1649ff"/>
        </div>
      </div>
    )
  }





  return (
    <>
      <div className={s.container}>
      {message && <Message success={success} failed={failed} setMessage={setMessage}/>}
      {plans.map((plan:any)  =>
        <div className={s.card} key={plan.id}>
          <div className={s.content3}>
          </div>
          <div className={s.content1}>
            <h2>{plan.title}</h2>
            <h3>{plan.amount}</h3>
            <p>{plan.desc}</p>
            <span></span>
          </div>
          <button onClick={() => handleInvest(plan.desc, plan.title)}>Invest</button>
          <div className={s.content2}>
            {plan.truepoints.map((truepoint: any) => <div key={truepoint} className={s.fact1}><span><BsCheck /><p>{truepoint}</p></span></div>) }
          </div>
        </div>
      )}
    </div>
    </>
  )
}
