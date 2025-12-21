import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className='bg-dark text-light mt-3 py-2'>
      {/* <!-- Copyright --> */}
      <div className='text-center  py-2'>
        &copy; {year} Copyright:{' '}
        <a className='text-info' href='/'>
          VolumteerHub
        </a>
      </div>
      {/* <!-- Copyright --> */}
    </footer>
  );
};

export default Footer;
