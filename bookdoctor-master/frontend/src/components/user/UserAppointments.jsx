import React, { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import { Container, Button } from 'react-bootstrap';
import axios from 'axios';
import { message } from 'antd';

const UserAppointments = () => {
  const [userId, setUserId] = useState(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [appointments, setAppointments] = useState([]);

  const getUser = () => {
    const user = JSON.parse(localStorage.getItem('userData'));
    if (user) {
      const { _id, isdoctor } = user;
      setUserId(_id);
      setIsDoctor(isdoctor);
    } else {
      alert('No user to show');
    }
  };

  const getAppointments = async () => {
    const endpoint = isDoctor
      ? 'http://localhost:8001/api/doctor/getdoctorappointments'
      : 'http://localhost:8001/api/user/getuserappointments';

    try {
      const res = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        params: {
          userId,
        },
      });
      if (res.data.success) {
        message.success(res.data.message);
        setAppointments(res.data.data);
      }
    } catch (error) {
      console.error(error);
      message.error('Something went wrong');
    }
  };

  const handleStatus = async (appointmentId, status) => {
    try {
      const res = await axios.post(
        'http://localhost:8001/api/doctor/handlestatus',
        {
          userid: userId,
          appointmentId,
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (res.data.success) {
        message.success(res.data.message);
        getAppointments();
      }
    } catch (error) {
      console.error(error);
      message.error('Something went wrong');
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    getAppointments();
  }, [userId, isDoctor]);

  const handleDownload = async (url, appointId) => {
    try {
      const res = await axios.get('http://localhost:8001/api/doctor/getdocumentdownload', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`,
        },
        params: { appointId },
        responseType: 'blob'
      });
      console.log(res.data)
      if (res.data) {
        const fileUrl = window.URL.createObjectURL(new Blob([res.data], { "type": "application/pdf" }));
        const downloadLink = document.createElement("a");
        document.body.appendChild(downloadLink);
        downloadLink.setAttribute("href", fileUrl);

        // Extract the file name from the url parameter
        const fileName = url.split("/").pop(); // Assuming the URL is in the format "uploads/document.pdf"

        console.log(fileUrl, downloadLink, fileName)
        // Set the file name for the download
        downloadLink.setAttribute("download", fileName);
        downloadLink.style.display = "none";
        downloadLink.click();
      } else {
        message.error(res.data.error);
      }
    } catch (error) {
      console.log(error);
      message.error('Something went wrong');
    }
  };

  const renderTable = () => {
    if (appointments.length === 0) {
      return (
        <tr>
          <td colSpan={isDoctor ? 6 : 3}>
            <Alert variant="info">
              <Alert.Heading>No Appointments to show</Alert.Heading>
            </Alert>
          </td>
        </tr>
      );
    }

    return appointments.map((appointment) => (
      <tr key={appointment._id}>
        {isDoctor ? (
          <>
            <td>{appointment.userInfo.fullName}</td>
            <td>{appointment.date}</td>
            <td>{appointment.userInfo.phone}</td>
            <td>
              <Button
                variant="link"
                onClick={() =>
                  handleDownload(appointment.document.path, appointment._id)
                }
              >
                {appointment.document.filename}
              </Button>
            </td>
            <td>{appointment.status}</td>
            <td>
              {appointment.status === 'approved' ? (
                <></>
              ) : (
                <Button
                  onClick={() =>
                    handleStatus(appointment._id, 'approved')
                  }
                >
                  Approve
                </Button>
              )}
            </td>
          </>
        ) : (
          <>
            <td>{appointment.docName}</td>
            <td>{appointment.date}</td>
            <td>{appointment.status}</td>
          </>
        )}
      </tr>
    ));
  };

  return (
    <div>
      <h2 className="p-3 text-center">All Appointments</h2>
      <Container>
        <Table striped bordered hover>
          <thead>
            <tr>
              {isDoctor ? (
                <>
                  <th>Name</th>
                  <th>Date of Appointment</th>
                  <th>Phone</th>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Action</th>
                </>
              ) : (
                <>
                  <th>Doctor Name</th>
                  <th>Date of Appointment</th>
                  <th>Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>{renderTable()}</tbody>
        </Table>
      </Container>
    </div>
  );
};

export default UserAppointments;
