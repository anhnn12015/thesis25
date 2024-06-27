// import React, { Fragment } from 'react';
// import { useLocation } from 'react-router-dom';
// import Header from '../Header/Header';
// import Footer from '../Footer/Footer';
// import Routers from '../../routers/Routers';

// const Layout = () => {
//   const location = useLocation();
//   const isLoginPage = location.pathname === '/login';

//   return (
//     <Fragment>
//       {!isLoginPage && <Header />}
//       <div>
//         <Routers />
//       </div>
//       {!isLoginPage && <Footer />}
//     </Fragment>
//   );
// };

// export default Layout;
import React, { Fragment } from 'react';
import { useLocation, Route } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Routers from '../../routers/Routers';

const Layout = () => {
  const location = useLocation();

  // Danh sách các route cần hiển thị Header và Footer
  const routesWithHeaderFooter = ['/', '/home', '/about'];

  // Kiểm tra xem route hiện tại có nằm trong danh sách hay không
  const shouldDisplayHeaderFooter = routesWithHeaderFooter.includes(location.pathname);

  return (
    <Fragment>
      {shouldDisplayHeaderFooter && <Header />}
      <div>
        <Routers />
      </div>
      {shouldDisplayHeaderFooter && <Footer />}
    </Fragment>
  );
};

export default Layout;
