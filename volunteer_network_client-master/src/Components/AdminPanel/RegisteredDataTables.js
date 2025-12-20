import React, { useEffect, useState } from 'react';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../../contexts/AuthContext';
import PreLoader from '../PreLoader/PreLoader';
import { adminService, registrationService } from '../../services/apiService';
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
    const fetchRegistrations = async () => {
      try {
        const data = await adminService.getAllRegistrations();
        setTaskList(data);
        setPreLoaderVisibility('none');
      } catch (error) {
        console.error("Failed to fetch registrations", error);
        setPreLoaderVisibility('none');
      }
    };
    fetchRegistrations();
  }, []);

  // Delete task when user click on delete button and update the dashboard
  const deleteTaskAdmin = async (id) => {
    if (window.confirm("Are you sure you want to delete this registration?")) {
      try {
        await registrationService.deleteRegistration(id);
        setTaskList(prev => prev.filter(task => task.id !== id));
      } catch (error) {
        console.error("Failed to delete registration", error);
        alert("Failed to delete registration");
      }
    }
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
              <tr key={task.id}>
                <td>{serialNo++}</td>
                <td>{task.user ? (task.user.fullName || task.user.username) : 'Unknown'}</td>
                <td>{task.user ? task.user.email : 'Unknown'}</td>
                <td>{task.registrationDate ? new Date(task.registrationDate).toLocaleDateString('vi-VN') : '-'}</td>
                <td>{task.event ? task.event.name : 'Unknown Event'}</td>

                <td className='text-center'>
                  <button
                    onClick={() => deleteTaskAdmin(task.id)}
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