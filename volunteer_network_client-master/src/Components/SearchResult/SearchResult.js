import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
// import tasksData from '../../fakeData/tasksData';
import TaskItem from '../TaskItem/TaskItem';
import '../Tasks/Tasks.css';

const SearchResult = () => {
  // Set data for search and filter:
  const [tasksDataSearch, setTasksDataSearch] = useState([]);

  // Get all tasks events from API
  useEffect(() => {
    fetch('https://volunteer-network-react.herokuapp.com/taskEvents')
      .then((res) => res.json())
      .then((data) => setTasksDataSearch(data));
  }, []);

  // Read user input using useParams and filter:
  const { searchQuery } = useParams();
  const searchResult = tasksDataSearch.filter((event) =>
    event.task.includes(searchQuery)
  );

  return (
    <div className='container tasks-area'>
      <div className='row my-3'>
        {(searchResult.length === 0 ) && (
          <h1 className='col-12 display-5 text-center'>No task found!</h1>
        )}
        {/* Pass filtered data to TaskItem component */}
        {searchResult.map((task) => (
          <TaskItem key={task._id} task={task}></TaskItem>
        ))}
      </div>
      <div className='text-center my-5'>
        {/* Click to show all tasks events */}
        <Link to='/'>
          <button className='btn btn-warning btn-secondary'>
            See all volunteer tasks
          </button>
        </Link>
      </div>
    </div>
  );
};

export default SearchResult;
