import React, { Fragment } from 'react';
import { useLocation, Route } from 'react-router-dom';
import Header from '../Header/Header';
import Routers from '../../routers/Routers';

const Layout = () => {
  const location = useLocation();

  // Danh sách các route cần hiển thị Header và Footer
  const routesWithHeaderFooter = ['/', '/home', '/about','/admin/home'];

  // Kiểm tra xem route hiện tại có nằm trong danh sách hay không
  const shouldDisplayHeaderFooter = routesWithHeaderFooter.includes(location.pathname);

  return (
    <Fragment>
      {shouldDisplayHeaderFooter && <Header />}
      <div>
        <Routers />
      </div>
    </Fragment>
  );
};

export default Layout;
