
import React, { useEffect, useState } from 'react';
import { NextPage, NextPageContext  } from 'next'
import { useCookies } from "react-cookie"
import styles from '../styles/App.module.css'
import axios from 'axios';
import { parseCookies, resolveApiHost } from "../helpers/"
import { useRouter } from 'next/router'
import Layout from "../components/layout"

interface Subject {
  id: number,
  name: string,
  test_chamber?: number,
  date_of_birth?: string,
  score?: number,
  alive?: boolean,
  created_at?: string,
  updated_at?: string
}

Subjects.getInitialProps = ({ req, res }: NextPageContext) => {
  const cookies = parseCookies(req);
  const { protocol, hostname } = resolveApiHost(req);
  return { XSRF_TOKEN: cookies["XSRF-TOKEN"], hostname, protocol };
}

export default function Subjects(props: NextPage & {XSRF_TOKEN: string, hostname: string, protocol:string}) {
  const router = useRouter();
  const [ authenticated, setAuth ] = useState<Boolean>(!!props.XSRF_TOKEN);

  const [ subjects, setSubjects ] = useState<Array<Subject>>();
  const [ message, setErrorMessage ] = useState<string>('');
  const [cookie, setCookie, removeCookie] = useCookies(["XSRF-TOKEN"])
  const api = `${props.protocol}//${props.hostname}`;
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC'); // Define setSortOrder
  const [sortProperty, setSortProperty] = useState<string>('CREATED_AT'); // Track the property to sort by

  const sortByProperty = (property: string) => {
    if (property === sortProperty) {
      // If clicking on the same property, toggle the sort order
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // If clicking on a different property, set the new property and default to ascending order
      setSortProperty(property);
      setSortOrder('ASC');
    }
  };

  const logout = async () => {
    try {
      await axios({
        method: "post",
        url: `${api}/logout`,
        withCredentials: true
      }).then((response) => {
        removeCookie("XSRF-TOKEN");
        setAuth(!(response.status === 204))
        return router.push('/');
      })
    } catch (e) {
      console.log(e);
    }
  }

  const create = () => {
    console.log('goto crete new subject ');
    router.push('/subject/create');
  }

  const update = (subject: Subject) => {
    console.log('goto update subject ');
    router.push(`/subject/update/${subject.id}`);
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) {
      return '???'
    }
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
  }

  useEffect(() => {
    console.log(' authenticated ', authenticated);
    console.log('props ', props);
    if (authenticated) {
      axios.post(
          `${api}/graphql`,
          {
            query: `
              query {
                subjects(orderBy: { column: ${sortProperty}, order: ${sortOrder} }) {
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
        console.log(response);
        const { subjects = [] } = response.data?.data;
        if (subjects && subjects.length > 0) {
          return setSubjects(subjects as Subject[]);
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
  }, [authenticated, sortProperty, sortOrder]);

  return (
      <Layout>
        <h1>Testing Subjects</h1>
        <section className={styles.content}>
          {message && (
              <p data-testid="error-msg">{message}</p>
          )}

          {authenticated && <button onClick={create}>New Record</button>}

          {subjects && subjects.length > 0 && (
              <table data-testid="subjects-table">
                <thead>
                <tr>
                  <td>ID</td>
                  <td>Name</td>
                  <td>
                  <span onClick={() => sortByProperty('DATE_OF_BIRTH')}  style={{ cursor: 'pointer' }}>
                    DOB {sortOrder === 'ASC' ? '↑' : '↓'}
                  </span>
                  </td>
                  <td>Alive</td>
                  <td>Score</td>
                  <td>
                  <span onClick={() => sortByProperty('TEST_CHAMBER')}  style={{ cursor: 'pointer' }}>
                    Test Chamber {sortOrder === 'ASC' ? '↑' : '↓'}
                  </span>
                  </td>
                  <td> Update </td>
                </tr>
                </thead>
                <tbody>
                {subjects.map(subject => (
                    <tr key={subject.id}>
                      <td>{subject.id}</td>
                      <td>{subject.name}</td>
                      <td>{formatDate(subject.date_of_birth)}</td>
                      <td>{subject.alive ? 'Y' : 'N'}</td>
                      <td>{subject.score}</td>
                      <td>{subject.test_chamber}</td>
                      <td>
                  <span onClick={() => update(subject)}  style={{ cursor: 'pointer' }}>
                    Update
                  </span>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
          )}
          {!subjects && !message && (
              <div className={styles.skeleton} data-testid="skeleton">
                <table>
                  <thead>
                  <tr>
                    <td>ID</td>
                    <td>Name</td>
                    <td>DOB</td>
                    <td>Alive</td>
                    <td>Score</td>
                    <td>Test Chamber</td>
                  </tr>
                  </thead>
                  <tbody>
                  {Array.from(Array(10).keys()).map(subject => (
                      <tr key={subject}>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
          {authenticated && <button onClick={logout}>Log out</button>}
        </section>
      </Layout>
  )
}
