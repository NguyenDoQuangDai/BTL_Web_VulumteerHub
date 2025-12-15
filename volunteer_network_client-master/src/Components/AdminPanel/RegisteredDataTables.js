import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PreLoader from '../PreLoader/PreLoader';
// ==============================================================================

const RegisteredDataTables = () => {
  // This is table showed in the Admin Dashboard with List of volunteer register
  // Set List of Volunteer register:
  const [taskList, setTaskList] = useState([]);

  // Auth context
  const { user, isAuthenticated } = useAuth();

  //PreLoader visibility
  const [preLoaderVisibility, setPreLoaderVisibility] = useState('block');

  // Get all the Volunteer Register
  useEffect(() => {
    fetch('https://volunteer-network-react.herokuapp.com/adminTasks')
      .then((res) => res.json())
      .then((data) => {
        setTaskList(data);
        setPreLoaderVisibility('none');
      });
  }, [taskList]);

  // Delete task when user click on delete button and update the dashboard
  const deleteTaskAdmin = (_id) => {
    fetch(`https://volunteer-network-react.herokuapp.com/deleteTask/${_id}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then((result) => {
        if (result) {
          console.log(result);
        }
      });
  };

  let serialNo = 1;

  return (
    <>
      <PreLoader visibility={preLoaderVisibility} />
      <div className='table-responsive'>
        <table className='table table-borderless table-hover bg-white rounded my-4'>
          <thead className='thead-light'>
            <tr>
              <th className='text-secondary text-left' scope='col'>
                #
              </th>
              <th className='text-secondary' scope='col'>
                Name
              </th>
              <th className='text-secondary' scope='col'>
                Email ID
              </th>
              <th className='text-secondary' scope='col'>
                Registration Date
              </th>
              <th className='text-secondary' scope='col'>
                Volunteer List
              </th>
              <th className='text-secondary' scope='col'>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {taskList.map((task) => (
              <tr key={task._id}>
                <td>{serialNo++}</td>
                <td>{task.name}</td>
                <td>{task.email}</td>
                <td>{task.registrationDate}</td>
                <td>{task.task}</td>

                <td className='text-center'>
                  <button
                    onClick={() => deleteTaskAdmin(task._id)}
                    className='btn btn-danger'
                  >
                    {' '}
                    <FontAwesomeIcon icon={faTrash} size='xs' />{' '}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default RegisteredDataTables;





  // // handle delete update
  // const handleDeleteUpdateAdmin = () => {
  //   fetch('https://volunteer-network-react.herokuapp.com/adminTasks')
  //     .then((res) => res.json())
  //     .then((data) => setTaskList(data));
  // };