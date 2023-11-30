
import React, { useEffect, useState } from 'react';
import { NextPage, NextPageContext  } from 'next'
import { useCookies } from "react-cookie"
import styles from '../../../styles/App.module.css'
import axios from 'axios';
import { parseCookies, resolveApiHost } from "../../../helpers"
import { useRouter } from 'next/router'
import Layout from "../../../components/layout"

interface Subject {
    id: number,
    name: string,
    test_chamber?: number,
    date_of_birth: string,
    score?: number,
    alive?: boolean,
    created_at?: string,
    updated_at?: string
}

function formatDateString(inputDate: string): string {
    const date = new Date(inputDate);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

UpdateSubject.getInitialProps = ({ req, res }: NextPageContext) => {
    const cookies = parseCookies(req);
    const { protocol, hostname } = resolveApiHost(req);
    return { XSRF_TOKEN: cookies["XSRF-TOKEN"], hostname, protocol };
}

export default function UpdateSubject(props: NextPage & {XSRF_TOKEN: string, hostname: string, protocol:string}) {
    const router = useRouter();
    const [ authenticated, setAuth ] = useState<Boolean>(!!props.XSRF_TOKEN);
    const [ subject, setSubject ] = useState<Subject>();
    const [cookie, setCookie, removeCookie] = useCookies(["XSRF-TOKEN"])
    const api = `${props.protocol}//${props.hostname}`;
    const [ message, setErrorMessage ] = useState<string>('');

    useEffect(() => {
        const id = router.query.id;
        console.log('router ' , router.query.id);
        if (authenticated && id) {
            axios.post(
                `${api}/graphql`,
                {
                    query: `
              query {
                subject(id: ${id}) {
                  id
                  name
                  test_chamber
                  date_of_birth
                  score
                  alive
                  created_at
                }
              }
            `
                },
                { withCredentials: true }
            ).then(response => {
                if (response.data?.data?.subject) {
                    return setSubject(response.data?.data?.subject);
                }
            }).catch((e) => {
                console.log(e);
                if (e.response?.data?.message) {
                    if (e.response?.data?.message === "CSRF token mismatch.") {
                        return setErrorMessage("Your session has expired, please log in again.");
                    } else {
                        return setErrorMessage(e.response?.data?.message);
                    }
                } else {
                    return setErrorMessage('An error occurred, please try again later.')
                }
            })
        } else {
            router.push('/');
            return;
        }
    }, [authenticated]);

    const update = async (event: any) => {
        event.preventDefault()
        if (authenticated && subject) {
            const birthdate = subject.date_of_birth ? subject.date_of_birth.substring(0,10)+' 00:00:00' : '';
            axios.post(
                `${api}/graphql`,
                {
                    query: `
                      mutation {
                        updateSubject(
                          id: ${subject.id}
                          name: "${subject.name}", 
                          date_of_birth: "${birthdate}", 
                          test_chamber:${subject.test_chamber}, 
                          score: ${subject.score}, 
                          alive: ${subject.alive}) 
                        {
                          id
                          name
                          date_of_birth
                          test_chamber
                          score
                          alive
                        }
                      }
                    `
                },
                { withCredentials: true }
            ).then(response => {
                router.push('/subjects');
            }).catch((e) => {
                console.log(e);
                if (e.response?.data?.message) {
                    if (e.response?.data?.message === "CSRF token mismatch.") {
                        return setErrorMessage("Your session has expired, please log in again.");
                    } else {
                        return setErrorMessage(e.response?.data?.message);
                    }
                } else {
                    return setErrorMessage('An error occurred, please try again later.')
                }
            })
        } else {
            router.push('/');
            return;
        }
    }

    return (
        <Layout>
            <h1>Update Record</h1>
            <section className={styles.content}>
                {message && <p data-testid="success-msg">{message}</p>}
                {subject && (
                    <form id="update" onSubmit={update} data-testid="update-form">
                        <div className={styles.inputGroup}>
                            <label htmlFor="name">Name</label>
                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={subject.name}
                                onChange={(e) => setSubject({ ...subject, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="date_of_birth">Date of Birth</label>
                            <input
                                id="date_of_birth"
                                type="date"
                                name="date_of_birth"
                                value={subject.date_of_birth.substring(0,10)}
                                onChange={(e) => setSubject({ ...subject, date_of_birth: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="alive">Alive</label>
                            <select
                                id="alive"
                                name="alive"
                                value={subject.alive ? 'Y' : 'N'}
                                onChange={(e) => setSubject({ ...subject, alive: e.target.value === 'Y' })}
                                required
                            >
                                <option value="Y">Yes</option>
                                <option value="N">No</option>
                            </select>
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="score">Score</label>
                            <input
                                id="score"
                                type="number"
                                name="score"
                                value={subject.score}
                                onChange={(e) => setSubject({ ...subject, score: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="test_chamber">Test Chamber</label>
                            <input
                                id="test_chamber"
                                type="number"
                                name="test_chamber"
                                value={subject.test_chamber}
                                onChange={(e) => setSubject({ ...subject, test_chamber: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <input id="submit" type="submit" value="Update" />
                        </div>
                    </form>
                )}

                {!subject && !message && (
                    <div className={styles.skeleton} data-testid="skeleton">
                        ...
                    </div>
                )}
                <button onClick={() => router.push('/subjects')}>Cancel</button>

            </section>
        </Layout>
    )
}
