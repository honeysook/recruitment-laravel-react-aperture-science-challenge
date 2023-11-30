
import React, { useState } from 'react'
import { NextPage, NextPageContext } from 'next'
import { useRouter } from 'next/router'
import styles from '../styles/App.module.css'
import axios from 'axios';
import { parseCookies, resolveApiHost } from "../helpers/"
import Layout from "../components/layout"

Home.getInitialProps = ({ req, res }: NextPageContext) => {
  const cookies = parseCookies(req);
  const { protocol, hostname } = resolveApiHost(req);
  return { XSRF_TOKEN: cookies["XSRF-TOKEN"], hostname, protocol };
}

export default function Home(props: NextPage & {XSRF_TOKEN: string, hostname: string, protocol: string}) {
  const [ message, setFormMessage ] = useState('');
  const router = useRouter();
  const api = `${props.protocol}//${props.hostname}`;
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [myemail, setMyemail] = useState('');

  const openDialog = () => setDialogOpen(true);
  const closeDialog = () => setDialogOpen(false);

  const login = async (event: any) => {
    event.preventDefault()
    try {
      await axios.get(
        `${api}/sanctum/csrf-cookie`,
        { withCredentials: true }
      ).then(async () => {
        await axios({
          method: "post",
          url: `${api}/login`,
          data: {
            "email": event.target.email.value,
            "password": event.target.password.value
          },
          withCredentials: true,
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Accept": "application/json",
            "Content-Type": "application/json",
            xsrfCookieName: 'XSRF-TOKEN',
            xsrfHeaderName: 'X-XSRF-TOKEN',
          }
        }).then(response => {
          console.log(response);

          axios.post(
              `${api}/graphql`,
              {
                query: `
                      query {
                        me 
                        {
                          id
                        }
                      }
                    `
              },
              { withCredentials: true }
          ).then(response => {
            if(response.data?.data?.me?.id) {
              localStorage.setItem('userid', response.data?.data?.me?.id);
              router.push('/subjects');
            } else {
              setFormMessage('An error occurred, please try again later.')
            }
          }).catch((e) => {
            console.log(e);
          })
        }).catch(e => {
          if (e.response?.data?.message) {
            setFormMessage(e.response?.data?.message);
          } else {
            setFormMessage('An error occurred, please try again later.')
          }
        })
      });
    } catch (err) {
      setFormMessage('An error occurred, please try again later.')
      console.log(err);
    }
  }

  const forgotPassword = async () => {

    console.log('email updated:', myemail);
    await axios.get(
        `${api}/sanctum/csrf-cookie`,
        { withCredentials: true }
    ).then(async () => {
      axios({
        method: "post",
        url: `${api}/forgot-password`,
        data: {
          "email": myemail
        },
        withCredentials: true
      }).then(response => {
        console.log('forgot sent email success', response);
        closeDialog();
      }).catch((e) => {
        console.log('forgot sent email fail', e);
        console.log(e);
        closeDialog();
      })
    }).catch((e) => {
      setFormMessage('forgot password error, please try again later.')
      console.log('error', e);
    })

  }

  return (
    <Layout>
      <h1>Please login</h1>
      <section className={styles.content}>
        <form id="login" onSubmit={login} data-testid="login-form">
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" />
          </div>
          {message && (
            <p data-testid="error-msg">{message}</p>
          )}
          <div className={styles.inputGroup}>
            <input id="submit" type="submit"/>
          </div>

          <div className={styles.inputGroup}>
            <button type="button" onClick={openDialog}>Forgot Password</button>
          </div>
        </form>

        {isDialogOpen && (
            <div className="modal-overlay">
              <div className="modal">
                <p>Enter your email.</p>
                <input
                    id="myemail"
                    type="email"
                    value={myemail}
                    onChange={(e) => setMyemail(e.target.value)}
                />

                <button onClick={forgotPassword}>Forgot Request Password</button>
                <button onClick={closeDialog}>Cancel</button>
              </div>
            </div>
        )}
      </section>
    </Layout>
  )
}
