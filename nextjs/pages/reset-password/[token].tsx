import {NextPage, NextPageContext} from "next";
import {useRouter} from "next/router";
import React, {useEffect, useState} from "react";
import axios from "axios";
import Layout from "../../components/layout";
import styles from "../../styles/App.module.css";
import {parseCookies, resolveApiHost} from "../../helpers";
import Home from "../index";

ResetPasswordPage.getInitialProps = ({ req, res }: NextPageContext) => {
    const cookies = parseCookies(req);
    const { protocol, hostname } = resolveApiHost(req);
    return { XSRF_TOKEN: cookies["XSRF-TOKEN"], hostname, protocol };
}
export default function ResetPasswordPage(props: NextPage & {XSRF_TOKEN: string, hostname: string, protocol:string}) {
    const router = useRouter();
    const api = `${props.protocol}//${props.hostname}`;
    const {token, email} = router.query

    const update = async (event: any) => {
        event.preventDefault()
        await axios.get(
            `${api}/sanctum/csrf-cookie`,
            { withCredentials: true }
        ).then(async () => {
            axios({
                method: "post",
                url: `http://localhost/reset-password`,
                data: {
                    "email": event.target.email.value,
                    "password": event.target.password.value,
                    "password_confirmation": event.target.password_confirmation.value,
                    "token": token
                },
                withCredentials: true
            }).then(response => {
                alert('password has been reset');
                router.push('/')
            }).catch((e) => {
                console.log(e);
            })
        }).catch((e) => {
            console.log(e);
        })
    }

    return (
        <Layout>
            <h1>Reset Password</h1>
            <section className={styles.content}>
                <form id="resetpassword" onSubmit={update} data-testid="reset-password-form">
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" name="email" />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" name="password" />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Confirm Password</label>
                        <input id="password_confirmation" type="password" name="password_confirmation" />
                    </div>

                    <div className={styles.inputGroup}>
                        <button id="submit" type="submit">Reset Password</button>
                    </div>
                </form>
            </section>

        </Layout>
    )
}
