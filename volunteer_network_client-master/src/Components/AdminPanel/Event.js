import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import './Event.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventService } from '../../services/apiService';
// ========================================================

const Event = () => {
  // this is for add event form:
  const { user } = useAuth();

  // handle redirected to home
  let history = useHistory();
  function handleEventUpdate() {
    history.push('/events');
  }

  // handle Add Event form Submit:
  const handleAddEvent = async (data) => {
    try {
      const eventData = {
        name: data.task,
        description: data.description,
        startDate: new Date(data.date).toISOString(),
        endDate: new Date(data.date).toISOString(),
        dateDeadline: new Date(data.date).toISOString(),
        location: data.location || 'Hà Nội',
        maxParticipants: parseInt(data.maxParticipants) || 100,
        imageUrl: data.image || 'https://i.ibb.co/WW2jrS0/ITHelp.png',
        status: 'APPROVED'
      };

      await eventService.createEvent(eventData);
      alert('Event created successfully!');
      handleEventUpdate();
    } catch (error) {
      console.error("Failed to create event", error);
      alert("Failed to create event: " + error.message);
    }
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
            <div className='form-group'>
              <label for='location'>Location</label>
              <input
                className='form-control'
                name='location'
                type='text'
                placeholder='Location'
                defaultValue='Hà Nội'
                ref={register({ required: true })}
              />
              {errors.location && <span className='error'>Location is required</span>}
            </div>
            <div className='form-group'>
              <label for='maxParticipants'>Max Participants</label>
              <input
                className='form-control'
                name='maxParticipants'
                type='number'
                placeholder='Max Participants'
                defaultValue='100'
                ref={register({ required: true })}
              />
              {errors.maxParticipants && <span className='error'>Max Participants is required</span>}
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
