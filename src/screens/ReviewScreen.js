"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, RefreshControl, Alert } from "react-native"
import {
  Card,
  Title,
  Paragraph,
  Searchbar,
  Chip,
  IconButton,
  Menu,
  useTheme,
  Button,
  Portal,
  Modal,
  TextInput,
  Avatar,
} from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { reviewAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"

const ReviewScreen = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [filteredReviews, setFilteredReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuVisible, setMenuVisible] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)
  const [adminResponse, setAdminResponse] = useState("")

  useEffect(() => {
    fetchReviews()
  }, [])

  useEffect(() => {
    filterReviews()
  }, [searchQuery, reviews])

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getReviews()
      setReviews(response.data)
    } catch (error) {
      console.error("Error fetching reviews:", error)
      Alert.alert("Error", "Failed to fetch reviews")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterReviews = () => {
    if (!searchQuery) {
      setFilteredReviews(reviews)
    } else {
      const filtered = reviews.filter(
        (review) =>
          review.product?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          review.comment?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredReviews(filtered)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchReviews()
  }

  const updateReviewStatus = async (reviewId, status) => {
    try {
      await reviewAPI.updateReview(reviewId, { status })
      fetchReviews()
      Alert.alert("Success", `Review ${status} successfully`)
    } catch (error) {
      Alert.alert("Error", "Failed to update review status")
    }
  }

  const submitAdminResponse = async () => {
    try {
      await reviewAPI.updateReview(selectedReview._id, { adminResponse })
      setModalVisible(false)
      setAdminResponse("")
      fetchReviews()
      Alert.alert("Success", "Admin response added successfully")
    } catch (error) {
      Alert.alert("Error", "Failed to add admin response")
    }
  }

  const toggleMenu = (reviewId) => {
    setMenuVisible((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
  }

  const openResponseModal = (review) => {
    setSelectedReview(review)
    setAdminResponse(review.adminResponse || "")
    setModalVisible(true)
  }

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={16}
            color="#FFD700"
          />
        ))}
      </View>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFF3E0"
      case "approved":
        return "#E8F5E8"
      case "rejected":
        return "#FFEBEE"
      default:
        return "#F5F5F5"
    }
  }

  const renderReview = ({ item }) => (
    <Card style={styles.reviewCard}>
      <Card.Content>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewInfo}>
            <View style={styles.customerInfo}>
              <Avatar.Text size={40} label={item.customer?.name?.charAt(0) || "U"} style={styles.avatar} />
              <View style={styles.customerDetails}>
                <Title style={styles.customerName}>{item.customer?.name || "Anonymous"}</Title>
                <Paragraph style={styles.productName}>{item.product?.title || "Unknown Product"}</Paragraph>
                <View style={styles.ratingRow}>
                  {renderStars(item.rating)}
                  <Paragraph style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Paragraph>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.reviewMeta}>
            <Chip mode="outlined" style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}>
              {item.status}
            </Chip>

            {(user?.role === "admin" || user?.role === "manager") && (
              <Menu
                visible={menuVisible[item._id]}
                onDismiss={() => toggleMenu(item._id)}
                anchor={<IconButton icon="dots-vertical" onPress={() => toggleMenu(item._id)} />}
              >
                <Menu.Item
                  onPress={() => {
                    toggleMenu(item._id)
                    updateReviewStatus(item._id, "approved")
                  }}
                  title="Approve"
                  leadingIcon="check"
                />
                <Menu.Item
                  onPress={() => {
                    toggleMenu(item._id)
                    updateReviewStatus(item._id, "rejected")
                  }}
                  title="Reject"
                  leadingIcon="close"
                />
                <Menu.Item
                  onPress={() => {
                    toggleMenu(item._id)
                    openResponseModal(item)
                  }}
                  title="Respond"
                  leadingIcon="reply"
                />
              </Menu>
            )}
          </View>
        </View>

        {item.comment && (
          <View style={styles.commentSection}>
            <Paragraph style={styles.comment}>"{item.comment}"</Paragraph>
          </View>
        )}

        {item.adminResponse && (
          <View style={styles.responseSection}>
            <Paragraph style={styles.responseLabel}>Admin Response:</Paragraph>
            <Paragraph style={styles.adminResponse}>{item.adminResponse}</Paragraph>
          </View>
        )}
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search reviews..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredReviews}
        renderItem={renderReview}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Admin Response</Title>
          <Paragraph style={styles.reviewModalInfo}>
            Review by {selectedReview?.customer?.name} for {selectedReview?.product?.title}
          </Paragraph>

          {selectedReview?.comment && (
            <View style={styles.originalComment}>
              <Paragraph style={styles.originalCommentLabel}>Original Review:</Paragraph>
              <Paragraph style={styles.originalCommentText}>"{selectedReview.comment}"</Paragraph>
            </View>
          )}

          <TextInput
            label="Your Response"
            value={adminResponse}
            onChangeText={setAdminResponse}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.modalInput}
            placeholder="Write your response to this review..."
          />

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={submitAdminResponse} style={styles.modalButton}>
              Submit Response
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  reviewCard: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  starsContainer: {
    flexDirection: "row",
  },
  reviewDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  reviewMeta: {
    alignItems: "flex-end",
  },
  statusChip: {
    height: 28,
    marginBottom: 8,
  },
  commentSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#1976D2",
  },
  comment: {
    fontSize: 14,
    fontStyle: "italic",
  },
  responseSection: {
    padding: 12,
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#2E7D32",
  },
  adminResponse: {
    fontSize: 14,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  reviewModalInfo: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    opacity: 0.7,
  },
  originalComment: {
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginBottom: 16,
  },
  originalCommentLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  originalCommentText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
})

export default ReviewScreen
