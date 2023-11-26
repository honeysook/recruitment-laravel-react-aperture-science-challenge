
import React, { useEffect, useState } from 'react';
import { NextPage, NextPageContext  } from 'next'
import { useCookies } from "react-cookie"
import styles from '../../styles/App.module.css'
import axios from 'axios';
import { parseCookies, resolveApiHost } from "../../helpers"
import { useRouter } from 'next/router'
import Layout from "../../components/layout"

interface Subject {
    name: string,
    test_chamber?: number,
    date_of_birth?: string,
    score?: number,
    alive?: boolean,
    created_at?: string,
    updated_at?: string
}

CreateSubject.getInitialProps = ({ req, res }: NextPageContext) => {
    const cookies = parseCookies(req);
    const { protocol, hostname } = resolveApiHost(req);
    return { XSRF_TOKEN: cookies["XSRF-TOKEN"], hostname, protocol };
}

export default function CreateSubject(props: NextPage & {XSRF_TOKEN: string, hostname: string, protocol:string}) {
    const router = useRouter();
    const [ authenticated, setAuth ] = useState<Boolean>(!!props.XSRF_TOKEN);
    const [ subject, setSubject ] = useState<Subject>({
        name: '',
        date_of_birth: '',
        alive: false,
        score: 0,
        test_chamber: 0,
    });
    const [cookie, setCookie, removeCookie] = useCookies(["XSRF-TOKEN"])
    const api = `${props.protocol}//${props.hostname}`;
    const [ message, setErrorMessage ] = useState<string>('');
    const userid = localStorage.getItem('userid');

    const create = async (event: any) => {
        event.preventDefault()
        if (authenticated) {
            axios.post(
                `${api}/graphql`,
                {
                    query: `
                      mutation {
                        createSubject(name: "${subject.name}", 
                          date_of_birth: "${subject.date_of_birth+' 00:00:00'}", 
                          test_chamber:${subject.test_chamber}, 
                          score: ${subject.score}, 
                          alive: ${subject.alive}, 
                          user_id: ${userid}
                          )
                        {
                          id
                          name
                          date_of_birth
                          test_chamber
                          score
                          alive
                          user_id
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

    useEffect(() => {
        if (!authenticated) {
            router.push('/');
            return;
        }
    }, [authenticated]);

    return (
        <Layout>
            <h1>Create New Record</h1>
            <section className={styles.content}>
                {message && <p data-testid="success-msg">{message}</p>}

                <form id="create" onSubmit={create} data-testid="create-form">
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
                            value={subject.date_of_birth}
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
                        <input id="submit" type="submit" value="Create" />
                    </div>
                </form>

                <button onClick={() => router.push('/subjects')}>Cancel</button>

            </section>
        </Layout>
    )
}
