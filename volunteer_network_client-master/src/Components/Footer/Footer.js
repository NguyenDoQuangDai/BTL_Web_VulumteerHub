import React from 'react';

const Footer = () => {
  return (
    <footer className='bg-dark text-light mt-3 py-2'>
      {/* <!-- Copyright --> */}
      <div className='text-center  py-2'>
        &copy; 2020 Copyright:{' '}
        <a className='text-info' href='http://dsfaisal.com/' target='_blank'>
          Volunteer Network
        </a>
      </div>
      {/* <!-- Copyright --> */}
    </footer>
  );
};

export default Footer;
