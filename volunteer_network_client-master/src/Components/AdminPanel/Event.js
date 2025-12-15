import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import './Event.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
// ========================================================

const Event = () => {
  // this is for add event form:
  // Set state for event
  const [existingEvent, setExistingEvent] = useState([]);

  // Set all existing event from API
  useEffect(() => {
    fetch('https://volunteer-network-react.herokuapp.com/taskEvents')
      .then((res) => res.json())
      .then((data) => setExistingEvent(data));
  }, []);

  // handle redirected to home
  let history = useHistory();
  function handleEventUpdate() {
    history.push('/');
  }

  // handle Add Event form Submit:
  const handleAddEvent = (data) => {
    const newEvent = { ...data };

    fetch('https://volunteer-network-react.herokuapp.com/addEvent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          handleEventUpdate();
        }
      });
  };

  // React hook form for extra form validation and error message
  const { register, handleSubmit, errors } = useForm();

  return (
    <div className='bg-white rounded my-4 p-4'>
      <form onSubmit={handleSubmit(handleAddEvent)} className='event-form'>
        <div className='row'>
          <div className='col-md-6'>
            <div className='form-group'>
              <label for='task'>Event title</label>
              <input
                className='form-control'
                name='task'
                type='text'
                placeholder='Event title'
                ref={register({ required: true })}
              />
              {errors.task && (
                <span className='error'>Event title is required</span>
              )}
            </div>
            <div className='form-group'>
              <label for='description'>Description</label>
              <textarea
                className='form-control'
                name='description'
                placeholder='Description'
                rows='5'
                ref={register({ required: true })}
              ></textarea>

              {errors.description && (
                <span className='error'>Description is required</span>
              )}
            </div>
          </div>

          <div className='col-md-6'>
            <div className='form-group'>
              <label for='registrationDate'>Date</label>
              <input
                className='form-control'
                name='date'
                type='date'
                ref={register({ required: true })}
              />
              {errors.date && <span className='error'>Date is required</span>}
            </div>
            <div className='form-group'>
              <label for='image'>Banner Image URL</label>
              <input
                className='form-control'
                name='image'
                type='text'
                defaultValue='https://i.ibb.co/WW2jrS0/ITHelp.png'
                ref={register({ required: false })}
              />
              {/* {errors.image && (
                <span className='error'>Image URL is required</span>
              )} */}
            </div>
            <p className='horizontal-or'> or </p>
            <div class='form-group'>
              <label
                for='imageUpload'
                className='file-upload btn btn-outline-primary btn-block w-50'
              >
                <FontAwesomeIcon
                  icon={faUpload}
                  className='mr-2'
                ></FontAwesomeIcon>
                Upload Banner Image
                <input id='imageUpload' name='imageUpload' type='file' />
              </label>
            </div>
          </div>
        </div>
        <div className='row'>
          <div className='col-md-12'>
            <div class='text-right'>
              <button type='submit' className='btn btn-primary'>
                Submit
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* <button className="btn btn-warning" onClick={handleAddEvent}>Add Bulk</button> */}
    </div>
  );
};

export default Event;
