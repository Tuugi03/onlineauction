import { Header, Footer } from "../../routes";

export const Layout = ({ children }) => {
    return (
    <>
        <Header />
        <main>{children}</main>
        <Footer />
    </>
    );
};